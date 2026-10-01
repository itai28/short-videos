"""Cents in Sixty #009 - a 'guaranteed 10% a week' pitch, done with math on $100 (Remotion)."""
import math

from studio.channels import CENTS_IN_SIXTY


def value(weeks, start=100.0, rate=0.10):
    """What $100 would be after `weeks` weeks at a 'guaranteed' 10% per week, compounded."""
    return start * (1 + rate) ** weeks


Y1, Y2, Y3, Y4, Y5 = (value(52 * k) for k in range(1, 6))
YEARLY = (1.1 ** 52 - 1) * 100                  # equivalent yearly return, in %
WEEKS_TO_MILLION = math.ceil(math.log(1e6 / 100) / math.log(1.1))   # quiz answer (pinned comment)

# every number said or shown is checked here
assert round(Y1) == 14204                       # "over fourteen thousand", "$14,204"
assert round(Y2 / 1e6, 1) == 2.0                # "two million", "$2.0M"
assert round(Y3 / 1e6) == 287                   # "$287 million"
assert 40e9 < Y4 < 41e9 and round(Y4 / 1e9, 1) == 40.7   # "over forty billion", "$40.7B"
assert round(Y5 / 1e12, 2) == 5.78              # "$5.78 trillion"
assert round(YEARLY) == 14104                   # "= 14,104% a year"
assert WEEKS_TO_MILLION == 97 and value(96) < 1e6 <= value(97)
assert round(100 * 1.10) == 110                 # one average ~10% stock year on $100

TITLE = "'Guaranteed 10% a Week'? I Did the Math on $100 (Red Flag)"
CAPTION = (
    "A 'guaranteed 10% a week' pitch, done with math: $100 x 1.10^52 = $14,204 after 52 weeks, "
    "$2.0 million after 2 years, $5.78 trillion after 5. No real investment does that. "
    "US stocks (S&P 500) have averaged about 10% a year since 1926 before inflation (about 7% after), "
    "with down years like 2008 (about -37%), never guaranteed. 'Guaranteed' plus huge returns is a classic "
    "fraud red flag (Investor.gov). Quiz answer pinned in the comments. Anyone in these comments offering "
    "guaranteed returns is running a scam. Education only, not financial advice. Voice: AI (Kokoro TTS). "
    "#scamalert #compoundinterest #mathtok #moneytok"
)

SPEC = {
    **CENTS_IN_SIXTY,
    "music": {"style": "minimal", "bpm": 88, "gain": 0.42},
    "style": {
        "camera": "none", "background": "none", "flash": False, "sceneEnter": "none", "captionY": 1262,
        "theme": {"bg1": "#CBB28C", "bg2": "#FAF7EE", "accent": "#FFCC33", "pop": "#FFF27A",
                  "danger": "#E8322A", "ink": "#1E2A4A", "panel": "#FAF7EE"},
    },
    "scenes": [
        {"say": "Guaranteed ten percent weekly?",
         "cap": "Guaranteed 10% weekly?",
         "visual": {"kind": "scam.photo", "mode": "hook"}, "sfx": [("swish", 0.0)]},
        {"say": "Bet. Let's do the math.",
         "visual": {"kind": "scam.notebook", "phase": "cut"},
         "sfx": [("bass", 1.35), ("swish", 1.45)]},
        {"say": "A hundred bucks. One year: over fourteen thousand. Two: two million.",
         "cap": "$100. 1 year: over $14,000. 2: $2 million.",
         "visual": {"kind": "scam.notebook", "phase": "curve"},
         "sfx": [("swish", 0.1), ("pop", 2.38), ("pop", 3.52)]},
        {"say": "Three: two hundred eighty-seven million. Four: over forty billion. Five: five point seven eight trillion.",
         "cap": "3: $287 million. 4: over $40 billion. 5: $5.78 trillion.",
         "visual": {"kind": "scam.notebook", "phase": "chase"},
         "sfx": [("pop", 0.41), ("riser", 1.9), ("pop", 2.67), ("whoosh", 3.0), ("riser", 3.45), ("pop", 4.12), ("rip", 4.7), ("thud", 4.74)]},
        {"say": "That's not investing. ⏸ That's fan fiction.",
         "visual": {"kind": "scam.notebook", "phase": "torn"},
         "sfx": [("swish", 0.4)]},
        {"say": "American stocks averaged about ten percent a year, before inflation, with down years.",
         "cap": "American stocks averaged about 10% a year, before inflation, with down years.",
         "visual": {"kind": "scam.real"},
         "sfx": [("swish", 0.1), ("chime", 1.9), ("thud", 4.07)]},
        {"say": "'Guaranteed' plus huge returns is a classic scam red flag.",
         "visual": {"kind": "scam.flag"},
         "sfx": [("swish", 0.1), ("swish", 0.8), ("stamp", 2.99), ("bass", 2.99)]},
        {"say": "How many weeks until a hundred hits a million? Comment your guess.", "hold": 1.3,
         "cap": "How many weeks until $100 hits $1 million? Comment your guess.",
         "visual": {"kind": "scam.quiz", "mode": "guess"},
         "sfx": [("pop", 2.43), ("pop", 3.03)]},
        {"say": "So next time someone DMs you…",
         "visual": {"kind": "scam.photo", "mode": "outro"},
         "sfx": [("buzz", 1.19)],
         # The exporter copies scene keys over its own timing fields, so this stretches only the Remotion
         # Sequence of the last scene: it then also covers the 0.1 s tail after the voice (otherwise those last
         # frames show a bare background plus scene 0's caption right before the loop). Audio timing is
         # unchanged; the outro photo counts down to timeline.frames, not to this value.
         "dur": 30.0},
    ],
}
