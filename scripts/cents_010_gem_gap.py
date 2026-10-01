"""Cents in Sixty #010 - the 100-gem gap: cheapest per gem is not cheapest for one 1,200-gem skin (Remotion)."""
from itertools import product

from studio.channels import CENTS_IN_SIXTY

# A made-up game shop. Every number on screen comes from here.
SKIN = 1200
PACKS = {"A": (500, 4.99), "B": (1100, 9.99), "C": (2400, 19.99), "D": (6500, 49.99)}
PER_1K = {k: round(p / g * 1000, 2) for k, (g, p) in PACKS.items()}
assert PER_1K == {"A": 9.98, "B": 9.08, "C": 8.33, "D": 7.69}

ways = []
for a, b, c, d in product(range(6), range(4), range(3), range(2)):
    gems = a * 500 + b * 1100 + c * 2400 + d * 6500
    cost = round(a * 4.99 + b * 9.99 + c * 19.99 + d * 49.99, 2)
    if gems >= SKIN:
        ways.append((cost, gems - SKIN, (a, b, c, d)))
ways.sort()
assert ways[0] == (14.97, 300, (3, 0, 0, 0))       # three A packs
assert ways[1] == (14.98, 400, (1, 1, 0, 0))       # A + B, one cent more
assert 1100 - SKIN == -100                          # B alone is 100 short
assert 2400 - SKIN == 1200 and 6500 - SKIN == 5300  # leftovers for C and D
assert round(300 * 4.99 / 500, 2) == 2.99           # leftover value at pack A's rate

TITLE = "The 100-Gem Gap: Pause on the Cheapest Way to Get This Skin"
CAPTION = (
    "Made-up game, real math. The skin costs 1,200 gems. Packs: 500 for $4.99, 1,100 for $9.99, "
    "2,400 for $19.99, 6,500 for $49.99. Per 1,000 gems the big pack is cheapest ($7.69 vs $9.98), "
    "but for this one skin the cheapest way is 3 small packs: $14.97 with 300 gems left over "
    "(A+B is $14.98 with 400 left). Cheapest per gem isn't cheapest for you if this skin is all you want. "
    "Prices are examples, not a real store. Education only, not financial advice. Voice: AI (Kokoro TTS). "
    "#gaming #unitprice #mathtok #moneytok"
)

class _LoopTail(dict):
    """The last scene. The exporter pads the timeline 0.1 s past the last scene (total = t + 0.1), and
    Short.tsx draws those ~6 frames black with scene 0's caption, which breaks the seamless loop.
    Report this scene's "dur" over that pad so its Sequence and captions run to the final frame.
    (Harmless once Short.tsx gives the last scene the remaining frames itself.)"""

    def items(self):
        d = dict(super().items())
        if "_dur" in d:
            d["dur"] = d["_dur"] + 0.12
        return d.items()


SPEC = {
    **CENTS_IN_SIXTY,
    "music": {"style": "arcade", "bpm": 150, "gain": 0.5},
    "style": {
        "camera": "none", "background": "none", "flash": False, "sceneEnter": "none", "captionY": 1280,
        "theme": {"bg1": "#0B0B12", "bg2": "#1A0B2E", "accent": "#FFCC33", "pop": "#2EF2FF",
                  "danger": "#FF4136", "ink": "#FFFFFF", "panel": "rgba(46,242,255,0.08)"},
    },
    "note": "Made-up game · real math",
    "scenes": [
        {"say": "Pause on the cheapest.",
         "visual": {"kind": "gem.shop", "mode": "hook"}},
        {"say": "This skin costs twelve hundred gems. Go.", "hold": 1.6,
         "cap": "This skin costs 1,200 gems. Go.",
         "visual": {"kind": "gem.shop", "mode": "guess"}},
        {"say": "⏸ Pack D is the best deal per gem… but costs almost fifty dollars.",
         "cap": "Pack D is the best deal per gem… but costs almost $50.",
         "visual": {"kind": "gem.shop", "mode": "paused", "out": True},
         "sfx": [("thud", 0.02), ("ding", 1.22), ("buzz", 3.25)]},
        {"say": "Pack B? Eleven hundred gems. A hundred short.",
         "cap": "Pack B? 1,100 gems. 100 short.",
         "visual": {"kind": "gem.bars", "mode": "b"},
         "sfx": [("whoosh", 0.0), ("blip", 0.5), ("blip", 0.9), ("buzz", 2.4)]},
        {"say": "Pack C works, for nineteen ninety-nine.",
         "cap": "Pack C works, for $19.99.",
         "visual": {"kind": "gem.bars", "mode": "c", "out": True},
         "sfx": [("swish", 0.4), ("pop", 1.2)]},
        {"say": "⏸ Answer: three A packs, fourteen ninety-seven, with three hundred left over.",
         "cap": "Answer: 3 A packs, $14.97, with 300 left over.",
         "visual": {"kind": "gem.answer", "out": True},
         "sfx": [("jingle", 0.6), ("thud", 3.4)]},
        {"say": "Cheapest per gem isn't cheapest for you, if this skin is all you want. Which did you pause on?",
         "visual": {"kind": "gem.lesson", "out": True}, "sfx": [("blip", 0.1), ("pop", 3.75)]},
        _LoopTail({"say": "Run it back, and this time…",
                   "visual": {"kind": "gem.shop", "mode": "outro"}, "sfx": [("whoosh", 0.0)]}),
    ],
}
