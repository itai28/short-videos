"""Cents in Sixty #007 - collecting all 6 blind-box figures takes 14.7 boxes on average (Remotion)."""
from fractions import Fraction as F

from studio.channels import CENTS_IN_SIXTY

N = 6
STEPS = [F(N, N - k) for k in range(N)]          # boxes for each NEW figure: 1, 1.2, 1.5, 2, 3, 6
TOTAL = sum(STEPS)                                # 147/10 = 14.7
DUPES = TOTAL - N                                 # 8.7
PRICE = 15                                        # example price per box
assert [float(s) for s in STEPS] == [1.0, 1.2, 1.5, 2.0, 3.0, 6.0]
assert TOTAL == F(147, 10) and DUPES == F(87, 10)
assert TOTAL * PRICE == F(441, 2) and N * PRICE == 90          # $220.50 vs $90
assert TOTAL * PRICE - N * PRICE == F(261, 2)                  # +$130.50
assert TOTAL == N * sum(F(1, k) for k in range(1, N + 1))      # 6 x (1 + 1/2 + ... + 1/6)
assert round((71 / 72) ** 49, 3) == 0.504                      # about half need 50+ boxes for a 1-in-72
# Two friends pooling + trading dupes: boxes until every design has 2 copies = 24.13, so about 12.1 each
# (checked with the brainstorm's Simpson integral and a 100k-run simulation).

TITLE = "Collecting All 6 Mystery Figures Takes 14.7 Boxes on Average, Not 6"
CAPTION = ("On average, a full set of 6 equally likely mystery figures takes 14.7 boxes (the coupon collector's problem): "
           "1 + 1.2 + 1.5 + 2 + 3 + 6. At an example $15 a box that's about $220.50 instead of $90, plus about 8.7 duplicates. "
           "A 1-in-72 secret figure is a hypothetical: 72 boxes on average. Two friends who trade dupes need about 12.1 boxes each. "
           "Assumes equal odds and independent boxes; these are averages, not guarantees. "
           "Education only, not financial advice. Voice: AI (Kokoro TTS). "
           "#mysterybox #couponcollector #mathtok #moneytok")

SPEC = {
    **CENTS_IN_SIXTY,
    "music": {"style": "musicbox", "bpm": 96, "gain": 0.5},
    "style": {"camera": "none", "background": "none", "flash": False, "sceneEnter": "none", "captionY": 1250,
              "theme": {"bg1": "#FFF4E6", "bg2": "#B9A3FF", "accent": "#FFCC33", "pop": "#7FE3C8",
                        "danger": "#FF5A6E", "ink": "#3B2A5A", "panel": "#FFFFFF"}},
    "note": "assumes 6 designs, equal odds, random boxes",
    "scenes": [
        {"say": "Fifteen boxes, not six.", "cap": "15 boxes, not 6.", "speed": 1.15,
         "visual": {"kind": "box.shelf", "mode": "hook"}, "sfx": [("pop", 0.0), ("stamp", 1.21)]},
        {"say": "That's the average for six mystery figures.",
         "cap": "That's the average for 6 mystery figures.",
         "visual": {"kind": "box.shelf", "mode": "reset"}, "sfx": [("whoosh", 0.05), ("swish", 0.2), ("pop", 1.22)]},
        {"say": "Each new one gets rarer… the last one alone averages six boxes.",
         "cap": "Each new one gets rarer… the last one alone averages 6 boxes.",
         "visual": {"kind": "box.stairs"},
         "sfx": [("blip", 0.2), ("blip", 0.44), ("blip", 0.68), ("blip", 0.92), ("blip", 1.16), ("thud", 1.82), ("bass", 1.82),
                 ("pop", 2.39), ("ding", 3.24)]},
        {"say": "Total: fourteen point seven. It's the coupon collector's problem.",
         "cap": "Total: 14.7. It's the coupon collector's problem.",
         "visual": {"kind": "box.equation"}, "sfx": [("swish", 0.0), ("shimmer", 0.3), ("pop", 0.86), ("stamp", 2.27)]},
        {"say": "If a box costs fifteen bucks, that's about two hundred twenty dollars, not ninety.",
         "cap": "If a box costs $15, that's about $220, not $90.",
         "visual": {"kind": "box.price"},
         "sfx": [("whoosh", 0.0), ("blip", 1.4), ("kaching", 3.0), ("thud", 3.63), ("pop", 3.95)]},
        {"say": "What about a secret with one in seventy-two odds? ⏸ Seventy-two boxes, on average.",
         "cap": "What about a secret with 1-in-72 odds? 72 boxes, on average.",
         "visual": {"kind": "box.secret"}, "sfx": [("whoosh", 0.0), ("kaching", 3.45)]},
        {"say": "Cheat code: trade dupes with a friend, or buy the one you want. Send this to your trading buddy.",
         "visual": {"kind": "box.trade"},
         "sfx": [("pop", 0.0), ("whoosh", 0.65), ("chime", 1.65), ("swish", 2.18), ("stamp", 2.73), ("swish", 3.45)]},
        # "dur" overrides this scene's timeline length so the outro also covers the 0.1 s tail after the
        # last scene (Short.tsx leaves those last frames bare: cream + scene 0's caption). The voiced length
        # is about 2.95 s; anything longer is clipped at the composition end, and the visual keys its loop
        # phase to timeline.frames, so the exact value does not matter as long as it is >= 3.1.
        {"say": "Comment your dupe count, because a set of six takes…",
         "cap": "Comment your dupe count, because a set of 6 takes…", "dur": 3.6,
         "visual": {"kind": "box.shelf", "mode": "outro"}, "sfx": [("swish", 0.05), ("pop", 1.3)]},
    ],
}
