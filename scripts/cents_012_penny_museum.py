"""Cents in Sixty #012 - the penny museum: which costs more to make $1, pennies or nickels? (Remotion)."""

from studio.channels import CENTS_IN_SIXTY

# US Mint FY2024 average unit costs (metal, fabrication, labor, overhead and distribution), in cents.
PENNY, NICKEL = 3.69, 13.78
PENNY_LOSS = round(PENNY - 1, 2)                   # 2.69 cents lost per penny
NICKEL_LOSS = round(NICKEL - 5, 2)                 # 8.78 cents lost per nickel
PENNIES_PER_DOLLAR = 100 * PENNY / 100             # $3.69 to make $1 of pennies
NICKELS_PER_DOLLAR = 20 * NICKEL / 100             # $2.756 to make $1 of nickels
assert (PENNY_LOSS, NICKEL_LOSS) == (2.69, 8.78)
assert f"{PENNIES_PER_DOLLAR:.2f}" == "3.69" and f"{NICKELS_PER_DOLLAR:.2f}" == "2.76"
assert f"{PENNIES_PER_DOLLAR - 1:.2f}" == "2.69" and f"{NICKELS_PER_DOLLAR - 1:.2f}" == "1.76"
assert PENNY > NICKEL / 5                          # so pennies cost more per dollar

TITLE = "It Cost 3.69¢ to Make 1¢. So Which Costs More to Make $1: Pennies or Nickels?"
CAPTION = ("US Mint FY2024 average unit costs: penny 3.69¢, nickel 13.78¢ (they include materials, labor, "
           "overhead and distribution). To make $1: 100 pennies = $3.69, 20 nickels = $2.76. The nickel loses "
           "more per coin (8.78¢ vs 2.69¢); the penny loses more per dollar. Circulating penny production ended "
           "in November 2025, and pennies are still legal tender, so your penny jar still spends. "
           "Education only, not financial advice. Voice: AI (Kokoro TTS). #penny #usmint #funfacts #moneytok")

SPEC = {
    **CENTS_IN_SIXTY,
    "music": {"style": "gallery", "bpm": 70, "gain": 0.5},
    "note": "Avg cost to make one coin · US Mint FY2024",
    "style": {"camera": "none", "background": "none", "flash": False, "sceneEnter": "none", "captionY": 1250,
              "theme": {"bg1": "#0E1A2E", "bg2": "#16263F", "accent": "#FFCC33", "pop": "#C8743C",
                        "danger": "#FF4D4D", "ink": "#FFFFFF", "panel": "rgba(255,231,176,0.08)"}},
    "scenes": [
        {"say": "This penny lost money.", "speed": 1.2,
         "visual": {"kind": "penny.gallery", "mode": "hook"}, "sfx": [("ding", 0.0)]},
        {"say": "Each cost three point six nine cents to make, on average.",
         "cap": "Each cost 3.69¢ to make, on average.", "note": True,
         "visual": {"kind": "penny.press", "mode": "run"},
         "sfx": [("whoosh", 0.0), ("stamp", 0.77), ("stamp", 1.57), ("stamp", 2.37)]},
        {"say": "So circulating penny production ended in twenty twenty-five.",
         "cap": "So circulating penny production ended in 2025.",
         "visual": {"kind": "penny.press", "mode": "stop"}, "sfx": [("bass", 0.1), ("thud", 1.55), ("swish", 1.85)]},
        {"say": "The nickel? Thirteen point seven eight cents.",
         "cap": "The nickel? 13.78¢.", "note": True,
         "visual": {"kind": "penny.gallery", "mode": "nickel"}, "sfx": [("swish", 0.0), ("ding", 0.9)]},
        {"say": "To make a dollar, what costs more: a hundred pennies, or twenty nickels?", "hold": 1.4,
         "cap": "To make $1, what costs more: 100 pennies, or 20 nickels?",
         "visual": {"kind": "penny.scale", "mode": "guess"}, "sfx": [("whoosh", 0.0)]},
        {"say": "⏸ Pennies cost more: three dollars sixty-nine, versus two seventy-six.", "speed": 1.1,
         "cap": "Pennies cost more: $3.69, versus $2.76.", "note": True,
         "visual": {"kind": "penny.scale", "mode": "reveal"}, "sfx": [("thud", 0.5), ("stamp", 2.5)]},
        {"say": "The nickel loses more per coin. The penny loses more per dollar.", "note": True,
         "visual": {"kind": "penny.damage"}, "sfx": [("buzz", 0.2), ("swish", 1.68), ("buzz", 2.0)]},
        {"say": "Nickel next? Comment yes or no.",
         "visual": {"kind": "penny.comment"}, "sfx": [("chime", 0.1), ("pop", 1.45), ("pop", 1.92)]},
        # "dur" overrides only this scene's Remotion Sequence length (the exporter copies scene keys over its
        # timing fields), so the outro also covers the exporter's 0.1 s tail after the last scene. Without it
        # those last frames show the bare navy background plus scene 0's caption right at the loop point.
        # Audio timing is unchanged (voiced length ~2.54 s); the outro keys its loop phase to timeline.frames.
        {"say": "That's why it's behind glass, because…", "dur": 3.2,
         "visual": {"kind": "penny.gallery", "mode": "outro"}, "sfx": [("shimmer", 0.0)]},
    ],
}
