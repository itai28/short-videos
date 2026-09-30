# shorts-studio

Makes original short videos for our channels and, later, schedules them through the official YouTube and TikTok APIs after a human approves each one.

## Make a video

    python3 -m pip install pillow imageio-ffmpeg
    python3 make_video.py scripts/cents_001_coffee.py

Output goes to `videos/<channel>/`: the MP4 plus a JSON file holding the title, caption and asset/license log.

## Layout

- `studio/render.py`: draws scenes frame by frame (Pillow) and encodes with ffmpeg. Content stays inside the TikTok/Shorts safe zone.
- `studio/finance.py`: money math, so every number on screen is computed.
- `studio/channels.py`: per-channel handle and colours.
- `scripts/`: one file per video (scenes, title, caption).

## Next

1. Voiceover (licensed TTS; needs an API key) and music from the YouTube Audio Library / TikTok Commercial Music Library.
2. A 60 to 75 second TikTok cut, so videos qualify for Creator Rewards.
3. Approval queue, then uploaders using YouTube Data API and TikTok Content Posting API with OAuth. No passwords are stored.
