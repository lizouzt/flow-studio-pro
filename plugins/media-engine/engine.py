"""Flow Studio Pro - Advanced Media Processing Engine.
Includes:
1. Frame Inspector & Diff Generation (Critic Review)
2. Optical Flow Alignment (MCI Beat Matching)
3. Non-linear Speed Ramping (Hit-point Freeze & Boost)
4. Master Video Rendering (Lanczos 1080p Upscaling & Audio Stitching)
"""
from __future__ import annotations

import argparse
import os
import sys
import subprocess
import shutil
from typing import List

def ensure_ffmpeg_in_path():
    """Ensure ffmpeg and ffprobe are in PATH even if the current shell session has not refreshed."""
    if shutil.which("ffmpeg") and shutil.which("ffprobe"):
        return

    candidate_paths = [
        os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin"),
        r"C:\ffmpeg\bin",
        r"C:\Program Files\ffmpeg\bin",
    ]

    winget_pkg_dir = os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages")
    if os.path.exists(winget_pkg_dir):
        for root, _, files in os.walk(winget_pkg_dir):
            if "ffmpeg.exe" in files and "ffprobe.exe" in files:
                candidate_paths.insert(0, root)
                break

    for p in candidate_paths:
        if os.path.exists(os.path.join(p, "ffmpeg.exe")):
            os.environ["PATH"] = p + os.pathsep + os.environ.get("PATH", "")
            break

ensure_ffmpeg_in_path()

try:
    from PIL import Image, ImageChops
except ImportError:
    Image = None
    ImageChops = None

def get_duration(video_path: str) -> float:
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        video_path
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
    return float(res.stdout.strip())

def inspect_frames(first_frame: str, last_frame: str, diff_output: str) -> dict:
    """Generate difference map and check dimensions."""
    if not Image:
        return {"passed": False, "error": "PIL not installed"}
    img_first = Image.open(first_frame)
    img_last = Image.open(last_frame)
    if img_first.size != img_last.size:
        return {
            "passed": False,
            "error": f"Resolution mismatch: {img_first.size} vs {img_last.size}"
        }
    diff = ImageChops.difference(img_first.convert("RGB"), img_last.convert("RGB"))
    os.makedirs(os.path.dirname(os.path.abspath(diff_output)), exist_ok=True)
    diff.save(diff_output)
    return {"passed": True, "diff_path": diff_output, "size": img_first.size}

def optical_flow_align(
    input_video: str,
    output_video: str,
    target_duration: float,
    target_fps: int = 30,
    fast_mode: bool = False
) -> str:
    """Align raw video to target voice duration using motion-compensated interpolation."""
    raw_dur = get_duration(input_video)
    pts_factor = target_duration / raw_dur
    os.makedirs(os.path.dirname(os.path.abspath(output_video)), exist_ok=True)

    if fast_mode or abs(pts_factor - 1.0) < 0.05:
        vf = f"setpts={pts_factor}*PTS,fps={target_fps}"
    else:
        # MCI Optical flow interpolation
        vf = (
            f"setpts={pts_factor}*PTS,"
            f"minterpolate='fps={target_fps}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1'"
        )

    cmd = [
        "ffmpeg", "-y",
        "-i", input_video,
        "-vf", vf,
        "-t", f"{target_duration:.4f}",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "19",
        "-pix_fmt", "yuv420p",
        "-colorspace", "bt709",
        output_video
    ]
    subprocess.run(cmd, check=True)
    return output_video

def speed_ramp_clip(
    input_video: str,
    output_video: str,
    hit_ratio: float = 0.5,
    fast_speed: float = 2.5,
    slow_speed: float = 0.3,
    slow_window_sec: float = 0.6,
    target_fps: int = 30
) -> str:
    """Apply dramatic non-linear speed ramp (rush -> freeze -> release)."""
    total_dur = get_duration(input_video)
    hit_time = total_dur * hit_ratio
    half_win = slow_window_sec / 2.0
    t1 = max(0.0, hit_time - half_win)
    t2 = min(total_dur, hit_time + half_win)

    pts_fast = 1.0 / fast_speed
    pts_slow = 1.0 / slow_speed
    pts_normal = 1.0

    os.makedirs(os.path.dirname(os.path.abspath(output_video)), exist_ok=True)

    filter_graph = (
        f"[0:v]trim=start=0:end={t1},setpts={pts_fast}*(PTS-STARTPTS)[v1];"
        f"[0:v]trim=start={t1}:end={t2},setpts={pts_slow}*(PTS-STARTPTS),"
        f"minterpolate='fps={target_fps}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1'[v2];"
        f"[0:v]trim=start={t2}:end={total_dur},setpts={pts_normal}*(PTS-STARTPTS)[v3];"
        f"[v1][v2][v3]concat=n=3:v=1:a=0[outv]"
    )

    cmd = [
        "ffmpeg", "-y",
        "-i", input_video,
        "-filter_complex", filter_graph,
        "-map", "[outv]",
        "-r", str(target_fps),
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "19",
        "-pix_fmt", "yuv420p",
        "-colorspace", "bt709",
        output_video
    ]
    subprocess.run(cmd, check=True)
    return output_video

def master_render(
    manifest_path: str,
    audio_path: str,
    output_master_path: str,
    total_duration: float | None = None
) -> str:
    """Concatenate synced clips, blend audio, and upscale with Lanczos filter."""
    os.makedirs(os.path.dirname(os.path.abspath(output_master_path)), exist_ok=True)
    cmd = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", manifest_path,
        "-i", audio_path,
        "-vf", "scale=1080:1920:flags=lanczos,unsharp=5:5:0.5:5:5:0.0",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "320k",
        "-pix_fmt", "yuv420p",
        "-colorspace", "bt709",
        "-color_primaries", "bt709",
        "-color_trc", "bt709",
        "-movflags", "+faststart"
    ]
    if total_duration and total_duration > 0:
        cmd.extend(["-t", f"{total_duration:.4f}"])
    cmd.append(output_master_path)
    subprocess.run(cmd, check=True)
    return output_master_path

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Media Engine CLI")
    subparsers = parser.add_subparsers(dest="command")

    # Inspect
    p_insp = subparsers.add_parser("inspect")
    p_insp.add_argument("--first", required=True)
    p_insp.add_argument("--last", required=True)
    p_insp.add_argument("--diff", required=True)

    # Align
    p_align = subparsers.add_parser("align")
    p_align.add_argument("--input", "-i", required=True)
    p_align.add_argument("--output", "-o", required=True)
    p_align.add_argument("--dur", "-d", type=float, required=True)
    p_align.add_argument("--fast", action="store_true")

    # Ramp
    p_ramp = subparsers.add_parser("ramp")
    p_ramp.add_argument("--input", "-i", required=True)
    p_ramp.add_argument("--output", "-o", required=True)
    p_ramp.add_argument("--hit", type=float, default=0.5)

    # Master
    p_mast = subparsers.add_parser("master")
    p_mast.add_argument("--manifest", required=True)
    p_mast.add_argument("--audio", required=True)
    p_mast.add_argument("--out", required=True)
    p_mast.add_argument("--dur", type=float, default=0.0)

    args = parser.parse_args()
    if args.command == "inspect":
        res = inspect_frames(args.first, args.last, args.diff)
        print(f"RESULT:{res}")
    elif args.command == "align":
        out = optical_flow_align(args.input, args.output, args.dur, fast_mode=args.fast)
        print(f"SUCCESS:{out}")
    elif args.command == "ramp":
        out = speed_ramp_clip(args.input, args.output, hit_ratio=args.hit)
        print(f"SUCCESS:{out}")
    elif args.command == "master":
        out = master_render(args.manifest, args.audio, args.out, total_duration=args.dur)
        print(f"SUCCESS:{out}")
