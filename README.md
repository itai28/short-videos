# shorts-studio

Makes original short videos for our channels and, later, schedules them through the official YouTube and TikTok APIs after a human approves each one.

## Make a video

Voiceover uses the open Kokoro-82M model (Apache-2.0). Download `kokoro-v1.0.onnx` and `voices-v1.0.bin` from https://github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0) into a folder and set `KOKORO_DIR` to it.

    python3 -m pip install pillow imageio-ffmpeg numpy soundfile kokoro-onnx
    python3 make_video.py scripts/cents_001_coffee.py

Output goes to `videos/<channel>/`: the MP4 plus a JSON file holding the title, caption and asset/license log.

## Layout

- `studio/render.py`: draws scenes frame by frame (Pillow) and encodes with ffmpeg. Content stays inside the TikTok/Shorts safe zone.
- `studio/finance.py`: money math, so every number on screen is computed.
- `studio/channels.py`: per-channel handle and colours.
- `scripts/`: one file per video (scenes, title, caption).

## Archive

Finished videos live in `archive/<channel>/` (MP4 + JSON with title, caption and asset licenses).

## Posting schedule

`python3 -m publish.schedule 2026-10-02` adds every archived video to `publish/schedule.json`, one a day: 6 PM ET on weekdays and 12 PM ET on weekends.

The **Publish schedule** GitHub Action runs every hour:

- **YouTube:** uploads each scheduled video as private with `publishAt`, and YouTube makes it public at that time.
- **TikTok:** at post time, sends the video to your TikTok inbox and opens a GitHub issue with the caption. You tap the TikTok notification, paste the caption and post. TikTok requires this until the developer app passes its audit.

### One-time setup (you)

1. **YouTube:** create a Google Cloud project, enable *YouTube Data API v3*, and create an OAuth client of type *Desktop app*. Download `client_secret.json`, run `python3 -m publish.youtube auth client_secret.json`, and sign in as the channel. Put the contents of `.secrets/youtube_token.json` in the repo secret `YT_TOKEN_JSON`. Uploads stay private until Google approves the API project in its [audit](https://support.google.com/youtube/contact/yt_api_form), so apply right away.
2. **TikTok:** create an app at developers.tiktok.com with Login Kit and Content Posting API (scope `video.upload`). Set the secrets `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET`, run `python3 -m publish.tiktok auth <redirect-uri>`, and put `.secrets/tiktok_token.json` in the secret `TIKTOK_TOKEN_JSON`.

No passwords are stored anywhere. Only revocable OAuth tokens are, and you can revoke them from your Google and TikTok account settings.
