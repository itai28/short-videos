"""Run the posting schedule. Safe to run as often as you like; it only does what's due.

  python3 -m publish.run youtube   # upload every scheduled video not yet on YouTube (YouTube publishes it at `at`)
  python3 -m publish.run tiktok    # send videos whose time has come to the TikTok inbox
"""
import datetime as dt
import json
import sys

from publish.schedule import ROOT, SCHEDULE


def load():
    return json.loads(SCHEDULE.read_text())


def save(entries):
    SCHEDULE.write_text(json.dumps(entries, indent=2) + "\n")


def youtube(entries):
    from publish import youtube as yt
    now = dt.datetime.now(dt.timezone.utc)
    for e in entries:
        if e["youtube_id"]:
            continue
        at = dt.datetime.fromisoformat(e["at"])
        if at < now:
            print("skip (slot already passed):", e["video"])
            continue
        e["youtube_id"] = yt.upload(str(ROOT / e["video"]), e["title"], e["caption"], at.isoformat())
        print("scheduled on YouTube:", e["video"], e["youtube_id"], e["at"])
        save(entries)


def tiktok(entries):
    from publish import tiktok as tt
    now = dt.datetime.now(dt.timezone.utc)
    due = [e for e in entries if not e["tiktok_sent"] and dt.datetime.fromisoformat(e["at"]) <= now]
    for e in due[:1]:          # at most one a run, so a backlog never floods the account
        tt.send_to_inbox(str(ROOT / e["video"]))
        e["tiktok_sent"] = True
        save(entries)
        print(f"TIKTOK_READY::{e['video']}::{e['caption']}")


if __name__ == "__main__":
    entries = load()
    {"youtube": youtube, "tiktok": tiktok}[sys.argv[1]](entries)
