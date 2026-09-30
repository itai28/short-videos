"""Build publish/schedule.json: one video a day, 6 PM ET on weekdays and 12 PM ET on weekends."""
import datetime as dt
import json
import pathlib
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/New_York")
ROOT = pathlib.Path(__file__).resolve().parent.parent
ARCHIVE = ROOT / "archive"
SCHEDULE = ROOT / "publish" / "schedule.json"


def slot(day):
    hour = 12 if day.weekday() >= 5 else 18
    return dt.datetime(day.year, day.month, day.day, hour, tzinfo=ET)


def build(start):
    existing = json.loads(SCHEDULE.read_text()) if SCHEDULE.exists() else []
    planned = {e["video"] for e in existing}
    day = max((dt.datetime.fromisoformat(e["at"]).astimezone(ET).date() + dt.timedelta(days=1) for e in existing),
              default=start)
    for meta_path in sorted(ARCHIVE.glob("*/*.json")):
        video = str(meta_path.with_suffix(".mp4").relative_to(ROOT))
        if video in planned:
            continue
        meta = json.loads(meta_path.read_text())
        existing.append({"video": video, "title": meta["title"], "caption": meta["caption"],
                         "at": slot(day).isoformat(), "youtube_id": None, "tiktok_sent": False})
        day += dt.timedelta(days=1)
    SCHEDULE.write_text(json.dumps(existing, indent=2) + "\n")
    return existing


if __name__ == "__main__":
    import sys
    start = dt.date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else dt.date.today() + dt.timedelta(days=1)
    for e in build(start):
        print(e["at"], e["video"])
