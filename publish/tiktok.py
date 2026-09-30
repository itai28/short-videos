"""Send videos to the TikTok account's inbox with the official Content Posting API.

TikTok's rules require the account owner to see and approve each post, so the video lands in the
TikTok app's inbox and you tap Post there (paste the caption from the GitHub issue this workflow opens).
Once the developer app passes TikTok's audit, this can switch to Direct Post.

Auth is OAuth: run `python3 -m publish.tiktok auth` and follow the link. Tokens are stored in
.secrets/tiktok_token.json locally, or come from the TIKTOK_TOKEN_JSON secret in GitHub Actions.
"""
import json
import math
import os
import pathlib
import secrets
import sys
import time
import urllib.parse

import requests

API = "https://open.tiktokapis.com/v2"
TOKEN_FILE = pathlib.Path(__file__).resolve().parent.parent / ".secrets" / "tiktok_token.json"
CHUNK = 10 * 1024 * 1024


def _client():
    return os.environ["TIKTOK_CLIENT_KEY"], os.environ["TIKTOK_CLIENT_SECRET"]


def _save(token):
    token["expires_at"] = time.time() + token.get("expires_in", 0)
    if not os.environ.get("TIKTOK_TOKEN_JSON"):
        TOKEN_FILE.parent.mkdir(exist_ok=True)
        TOKEN_FILE.write_text(json.dumps(token))
    return token


def access_token():
    token = json.loads(os.environ.get("TIKTOK_TOKEN_JSON") or TOKEN_FILE.read_text())
    if time.time() < token.get("expires_at", 0) - 300:
        return token["access_token"]
    key, secret = _client()
    r = requests.post(f"{API}/oauth/token/", data={
        "client_key": key, "client_secret": secret, "grant_type": "refresh_token",
        "refresh_token": token["refresh_token"]}, timeout=30)
    r.raise_for_status()
    return _save(r.json())["access_token"]


def authorize(redirect_uri):
    key, secret = _client()
    state = secrets.token_urlsafe(16)
    url = "https://www.tiktok.com/v2/auth/authorize/?" + urllib.parse.urlencode({
        "client_key": key, "scope": "user.info.basic,video.upload", "response_type": "code",
        "redirect_uri": redirect_uri, "state": state})
    print("Open this link, approve, then paste the full URL you were redirected to:\n" + url)
    back = urllib.parse.urlparse(input("> ").strip())
    params = urllib.parse.parse_qs(back.query)
    assert params.get("state", [""])[0] == state, "state mismatch, try again"
    r = requests.post(f"{API}/oauth/token/", data={
        "client_key": key, "client_secret": secret, "code": params["code"][0],
        "grant_type": "authorization_code", "redirect_uri": redirect_uri}, timeout=30)
    r.raise_for_status()
    _save(r.json())
    print(f"Saved token to {TOKEN_FILE}. For GitHub Actions, paste its contents into the TIKTOK_TOKEN_JSON secret.")


def send_to_inbox(video_path):
    size = os.path.getsize(video_path)
    chunk = size if size <= CHUNK else CHUNK
    count = math.ceil(size / chunk) if size > CHUNK else 1
    headers = {"Authorization": f"Bearer {access_token()}", "Content-Type": "application/json; charset=UTF-8"}
    r = requests.post(f"{API}/post/publish/inbox/video/init/", headers=headers, timeout=30, json={
        "source_info": {"source": "FILE_UPLOAD", "video_size": size, "chunk_size": chunk,
                        "total_chunk_count": count}})
    r.raise_for_status()
    data = r.json()["data"]
    with open(video_path, "rb") as f:
        for i in range(count):
            start = i * chunk
            body = f.read(chunk if i < count - 1 else size - start)
            put = requests.put(data["upload_url"], data=body, timeout=300, headers={
                "Content-Type": "video/mp4", "Content-Length": str(len(body)),
                "Content-Range": f"bytes {start}-{start + len(body) - 1}/{size}"})
            put.raise_for_status()
    return data["publish_id"]


if __name__ == "__main__":
    if sys.argv[1:2] == ["auth"]:
        authorize(sys.argv[2] if len(sys.argv) > 2 else os.environ["TIKTOK_REDIRECT_URI"])
