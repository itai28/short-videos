"""Cents in Sixty #011 - one 18-inch pizza vs two 12-inch pizzas (Remotion)."""
import math

from studio.channels import CENTS_IN_SIXTY


def area(d):
    return math.pi * (d / 2) ** 2


BIG, MED = area(18), 2 * area(12)
GAP = BIG - MED                      # = 9π = area of a 6-inch pizza
assert abs(GAP - area(6)) < 1e-9

TITLE = "One 18-Inch Pizza Has More Pizza Than Two 12-Inch Pizzas"
CAPTION = (f"Pizza is sold by width, but you eat the area (π × r²). One 18-inch pizza ≈ {BIG:.1f} sq in; "
           f"two 12-inch pizzas ≈ {MED:.1f} sq in. The difference (≈{GAP:.1f} sq in) is exactly one 6-inch pizza. "
           "Double the width = 4x the pizza, so compare price per square inch. Crust and toppings vary. "
           "Voice: AI (Kokoro TTS). #pizza #mathtok #moneytok #lifehack")

SPEC = {
    **CENTS_IN_SIXTY,
    "music": {"style": "chip", "bpm": 112, "gain": 0.55},
    "style": {"camera": "none", "background": "none", "flash": False, "sceneEnter": "none", "captionY": 1250,
              "theme": {"bg1": "#2b0f0a", "bg2": "#5c1d12", "accent": "#FFCC33", "pop": "#7CE0A3"}},
    "scenes": [
        {"say": "One pizza beats two.", "speed": 1.2,
         "visual": {"kind": "pizza.versus", "mode": "hook"}, "sfx": [("pop", 0.0)]},
        {"say": "Which is more pizza: one eighteen-inch, or two twelve-inch?", "hold": 1.5,
         "cap": "Which is more pizza: one 18-inch, or two 12-inch?",
         "visual": {"kind": "pizza.versus", "mode": "guess", "ring_at": "end"}},
        {"say": "Two sounds like more. ⏸ It's not.", "speed": 1.05,
         "visual": {"kind": "pizza.versus", "mode": "reveal"}},
        {"say": "You pay for the width, but you eat the area.",
         "visual": {"kind": "pizza.ruler"}, "sfx": [("whoosh", 0.1)]},
        {"say": "Eighteen-inch: about two hundred fifty-four square inches. Two twelves: about two twenty-six.",
         "cap": f"18-inch: about {BIG:.0f} square inches. Two 12s: about {MED:.0f}.",
         "visual": {"kind": "pizza.area", "big": round(BIG, 3), "med": round(MED, 3)}},
        {"say": "The difference? ⏸ A whole extra six-inch pizza.", "speed": 1.05,
         "cap": "The difference? A whole extra 6-inch pizza.",
         "visual": {"kind": "pizza.gap"}},
        {"say": "Double the width, and you get four times the pizza.",
         "visual": {"kind": "pizza.double"}, "sfx": [("pop", 1.2)]},
        {"say": "So check the price per square inch. Send this to whoever orders for the group.",
         "visual": {"kind": "pizza.tip"}, "sfx": [("kaching", 0.4)]},
        {"say": "Comment the size you always get, because…",
         "visual": {"kind": "pizza.versus", "mode": "outro"}},
    ],
}
