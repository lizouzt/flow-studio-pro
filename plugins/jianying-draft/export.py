"""JianYing Pro Draft Exporter Plugin for Flow Studio Pro.

Accepts resolved project JSON and builds a JianYing Pro draft with adaptive pacing and hybrid video-image fallback.
"""
from __future__ import annotations

import argparse
import json
import os
import sys

MICROSECOND = 1_000_000

def get_media_duration_sec(path: str) -> float:
    try:
        import pymediainfo
        media_info = pymediainfo.MediaInfo.parse(path)
        for track in media_info.tracks:
            if track.track_type == "Video":
                return float(track.duration) / 1000.0
    except Exception as e:
        print(f"Warning: failed to read video duration via pymediainfo: {e}", file=sys.stderr)
    return 0.0

def export_draft(project_json_path: str, output_drafts_dir: str | None = None) -> str:
    import pyJianYingDraft as draft
    from pyJianYingDraft import Draft, Video_segment, Audio_segment

    with open(project_json_path, "r", encoding="utf-8") as f:
        project = json.load(f)

    project_name = project.get("project_name", "StoryStudio_Draft")
    audio_path = project.get("audio_path")
    srt_path = project.get("srt_path")
    shots = project.get("shots", [])

    if not output_drafts_dir:
        # Default JianYing drafts directory on Windows
        user_home = os.path.expanduser("~")
        candidate = os.path.join(user_home, "AppData", "Local", "JianyingPro", "User Data", "Projects", "com.lveditor.draft")
        if os.path.exists(candidate):
            output_drafts_dir = candidate
        else:
            output_drafts_dir = os.path.abspath(os.path.join(os.path.dirname(project_json_path), "drafts"))
            os.makedirs(output_drafts_dir, exist_ok=True)

    my_draft = Draft(project_name, width=1080, height=1920)
    video_track = my_draft.add_track(draft.TrackType.video)
    audio_track = my_draft.add_track(draft.TrackType.audio)

    current_timeline_us = 0

    for shot in shots:
        shot_id = shot.get("shot_id", "shot")
        v_path = shot.get("rendered_video_path")
        img_path = shot.get("keyframe_image")
        target_dur_sec = float(shot.get("target_duration_sec", 5.0))
        target_dur_us = int(round(target_dur_sec * MICROSECOND))

        if v_path and os.path.exists(v_path):
            actual_sec = get_media_duration_sec(v_path)
            actual_us = int(round(actual_sec * MICROSECOND))
            if actual_sec >= target_dur_sec:
                v_seg = Video_segment(
                    material_path=os.path.abspath(v_path),
                    source_timerange=(0, target_dur_us),
                    target_timerange=(current_timeline_us, target_dur_us),
                    speed=1.0
                )
                video_track.add_segment(v_seg)
            elif actual_sec >= target_dur_sec * 0.88:
                speed_ratio = round(actual_sec / target_dur_sec, 2)
                v_seg = Video_segment(
                    material_path=os.path.abspath(v_path),
                    source_timerange=(0, actual_us),
                    target_timerange=(current_timeline_us, target_dur_us),
                    speed=speed_ratio
                )
                video_track.add_segment(v_seg)
            else:
                v_seg = Video_segment(
                    material_path=os.path.abspath(v_path),
                    source_timerange=(0, actual_us),
                    target_timerange=(current_timeline_us, actual_us),
                    speed=1.0
                )
                video_track.add_segment(v_seg)
                remain_us = target_dur_us - actual_us
                if img_path and os.path.exists(img_path):
                    fill_seg = Video_segment(
                        material_path=os.path.abspath(img_path),
                        source_timerange=(0, remain_us),
                        target_timerange=(current_timeline_us + actual_us, remain_us)
                    )
                    video_track.add_segment(fill_seg)
        elif img_path and os.path.exists(img_path):
            print(f"Fallback: shot {shot_id} uses keyframe image")
            v_seg = Video_segment(
                material_path=os.path.abspath(img_path),
                source_timerange=(0, target_dur_us),
                target_timerange=(current_timeline_us, target_dur_us)
            )
            video_track.add_segment(v_seg)
        else:
            print(f"Warning: shot {shot_id} missing video and image", file=sys.stderr)
            continue

        current_timeline_us += target_dur_us

    if audio_path and os.path.exists(audio_path):
        audio_seg = Audio_segment(
            material_path=os.path.abspath(audio_path),
            source_timerange=(0, current_timeline_us),
            target_timerange=(0, current_timeline_us)
        )
        audio_track.add_segment(audio_seg)

    if srt_path and os.path.exists(srt_path):
        try:
            my_draft.import_srt(os.path.abspath(srt_path))
        except Exception as e:
            print(f"Warning: import_srt failed: {e}", file=sys.stderr)

    my_draft.save(output_drafts_dir)
    final_draft_path = os.path.join(output_drafts_dir, project_name)
    print(f"DRAFT_SUCCESS: {final_draft_path}")
    return final_draft_path

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="JianYing Pro Draft Exporter")
    parser.add_argument("project_json", help="Path to resolved project JSON")
    parser.add_argument("--drafts-dir", default=None, help="Custom JianYing drafts directory")
    args = parser.parse_args()

    export_draft(args.project_json, args.drafts_dir)
