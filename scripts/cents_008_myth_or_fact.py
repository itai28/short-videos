"""Cents in Sixty #008 - Myth or fact? 3 money rounds to beat your parents (Remotion).

Game-show stage: a question card, a silent countdown ring, MYTH and FACT buzzers.
Round 1: checking your own credit score is a soft inquiry (no score impact).
Round 2: debit card use is not reported to the credit bureaus, so it does not build credit.
Boss round: a raise into the 22% bracket only taxes the dollars past the line at 22%.
"""
from studio.channels import CENTS_IN_SIXTY

# 2026 federal income tax brackets, single filer (IRS IR-2025-103): 10% to 12,400; 12% to 50,400; 22% to 105,700
BRACKETS = [(12400, 0.10), (50400, 0.12), (105700, 0.22)]


def tax(x):
    t, lo = 0.0, 0
    for hi, r in BRACKETS:
        if x > lo:
            t += (min(x, hi) - lo) * r
        lo = hi
    return round(t, 2)


BEFORE, AFTER, LINE = 50000, 51000, 50400
EXTRA = round(tax(AFTER) - tax(BEFORE), 2)          # 180
KEPT = round((AFTER - BEFORE) - EXTRA, 2)           # 820
LOW = round((LINE - BEFORE) * 0.12, 2)              # 48  (400 x 12%)
HIGH = round((AFTER - LINE) * 0.22, 2)              # 132 (600 x 22%)
assert (EXTRA, KEPT, LOW, HIGH) == (180, 820, 48, 132)
assert LOW + HIGH == EXTRA
# brackets alone never make take-home fall when income rises
assert all((x + 1 - tax(x + 1)) > (x - tax(x)) for x in range(0, 105700, 7))

TITLE = "Myth or Fact? 3 Money Rounds to Beat Your Parents"
CAPTION = ("Myth or fact: score yourself, then quiz a parent. "
           "1) Checking your OWN credit score is a soft inquiry and doesn't lower it (CFPB). "
           "2) Debit card use isn't reported to the credit bureaus, so it doesn't build credit (CFPB). "
           "3) Boss round: 2026 federal brackets, single filer, taxable income $50,000 to $51,000: "
           f"$400 x 12% + $600 x 22% = ${EXTRA:.0f}, so you keep ${KEPT:.0f} of a $1,000 raise after federal income tax. "
           "Payroll and state taxes not included; benefit and credit cliffs are a separate issue (IRS IR-2025-103). "
           "Education only, not financial advice. Voice: AI (Kokoro TTS). "
           "#mythorfact #creditscore #taxbrackets #moneytok")


SPEC = {
    **CENTS_IN_SIXTY,
    "music": {"style": "gameshow", "bpm": 120, "gain": 0.5},
    "style": {
        "camera": "none", "background": "none", "flash": False, "sceneEnter": "none", "captionY": 380,
        "theme": {"bg1": "#2A0F4F", "bg2": "#14062B", "accent": "#FFCC33", "pop": "#1ED6C4",
                  "danger": "#FF3B5C", "ink": "#FFFFFF", "panel": "rgba(255,255,255,0.08)"},
    },
    "note": "2026 federal brackets, single filer, taxable income. Federal income tax only.",
    "scenes": [
        {"say": "Myth or fact?", "speed": 1.12,
         "visual": {"kind": "myth.hook", "round": 1}, "sfx": [("fanfare", 0.0)]},
        {"say": "Checking your own credit score can lower it.", "hold": 1.4,
         "visual": {"kind": "myth.question", "round": 1, "mode": "guess"}},
        {"say": "⏸ Myth. It's a soft inquiry.",
         "visual": {"kind": "myth.answer", "round": 1}, "sfx": [("buzz", 0.5), ("stamp", 0.53)]},
        {"say": "Using a debit card doesn't build credit.", "hold": 1.4,
         "visual": {"kind": "myth.question", "round": 2, "mode": "guess"}, "sfx": [("swish", 0.0)]},
        {"say": "⏸ Fact. Debit isn't reported to the credit bureaus.",
         "visual": {"kind": "myth.answer", "round": 2}, "sfx": [("chime", 0.5), ("stamp", 0.53)]},
        {"say": "Boss level: a bracket bump can lower your pay.", "hold": 1.4,
         "visual": {"kind": "myth.question", "round": 3, "mode": "guess"},
         "sfx": [("swish", 0.0), ("thud", 0.3)]},
        {"say": "⏸ Myth. Only dollars over the line pay more.",
         "visual": {"kind": "myth.answer", "round": 3, "line": LINE},
         "sfx": [("buzz", 0.5), ("stamp", 0.53), ("bass", 0.5)]},
        {"say": "A thousand-dollar raise? You keep eight hundred twenty after federal income tax.",
         "cap": f"A $1,000 raise? You keep ${KEPT:.0f} after federal income tax.",
         "visual": {"kind": "myth.math", "round": 3, "line": LINE, "low": LOW, "high": HIGH,
                    "extra": EXTRA, "kept": KEPT},
         "sfx": [("kaching", 2.3)]},
        {"say": "Comment your score, then ask a parent…", "hold": 0.25,
         "visual": {"kind": "myth.outro", "round": 1}, "sfx": [("swish", 0.0), ("whoosh", 2.05)]},
    ],
}
