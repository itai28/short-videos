"""Upload to YouTube with the official Data API and let YouTube publish at the scheduled time.

Auth is OAuth: `python3 -m publish.youtube auth client_secret.json` opens Google's sign-in once and
stores a refresh token. No password is ever stored. In GitHub Actions the token comes from the
YT_TOKEN_JSON secret.
"""
import json
import os
import pathlib
import sys

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
TOKEN_FILE = pathlib.Path(__file__).resolve().parent.parent / ".secrets" / "youtube_token.json"


def credentials():
    raw = os.environ.get("YT_TOKEN_JSON") or TOKEN_FILE.read_text()
    creds = Credentials.from_authorized_user_info(json.loads(raw), SCOPES)
    if not creds.valid:
        creds.refresh(Request())
    return creds


def authorize(client_secret_path):
    from google_auth_oauthlib.flow import InstalledAppFlow
    creds = InstalledAppFlow.from_client_secrets_file(client_secret_path, SCOPES).run_local_server(port=0)
    TOKEN_FILE.parent.mkdir(exist_ok=True)
    TOKEN_FILE.write_text(creds.to_json())
    print(f"Saved token to {TOKEN_FILE}. For GitHub Actions, paste its contents into the YT_TOKEN_JSON secret.")


def upload(video_path, title, caption, publish_at):
    yt = build("youtube", "v3", credentials=credentials())
    body = {
        "snippet": {"title": title[:100], "description": caption + " #shorts", "categoryId": "27"},  # Education
        "status": {
            "privacyStatus": "private",
            "publishAt": publish_at,
            "selfDeclaredMadeForKids": False,
            "containsSyntheticMedia": True,   # AI voiceover: disclose it
        },
    }
    media = MediaFileUpload(video_path, mimetype="video/mp4", resumable=True)
    request = yt.videos().insert(part="snippet,status", body=body, media_body=media)
    response = None
    while response is None:
        _, response = request.next_chunk()
    return response["id"]


if __name__ == "__main__":
    if sys.argv[1:2] == ["auth"]:
        authorize(sys.argv[2])
