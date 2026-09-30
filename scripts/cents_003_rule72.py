"""Cents in Sixty #003 - the Rule of 72 cheat code."""
import math

from studio.channels import CENTS_IN_SIXTY

exact_7 = math.log(2) / math.log(1.07)

TITLE = "The money cheat code nobody taught you (Rule of 72)"
CAPTION = (f"Rule of 72: divide 72 by your interest rate to see how many years it takes your money to double. "
           f"At 7% that's about {exact_7:.0f} years; at 1% it's 72 years. "
           "Save this and show your parents. #money #personalfinance #fintok #moneytips")

SPEC = {
    **CENTS_IN_SIXTY,
    "scenes": [
        {"say": "Here's a money cheat code they don't teach you in school.",
         "visual": {"kind": "hero", "icon": "gamepad"}, "sfx": [("pop", 0.2)]},
        {"say": "It's called the rule of seventy-two. Take seventy-two, and divide it by your interest rate.",
         "visual": {"kind": "stack", "lines": [{"text": "72", "size": 150, "accent": True, "at": 0.8},
                                               {"text": "÷ interest rate", "size": 90, "at": 2.6}]},
         "sfx": [("pop", 0.8), ("pop", 2.6)]},
        {"say": "The answer is how many years it takes your money to double.",
         "visual": {"kind": "stack", "lines": [{"text": "= years to", "size": 90}, {"text": "DOUBLE", "size": 140, "accent": True, "at": 1.0}]},
         "sfx": [("ding", 1.0)]},
        {"say": "A normal bank account paying one percent? Seventy-two years to double. You'd be old.",
         "visual": {"kind": "stack", "lines": [{"text": "Bank: 1%", "size": 100},
                                               {"text": "72 years", "size": 130, "accent": True, "at": 1.4}]},
         "sfx": [("whoosh", 0.0), ("pop", 1.4)]},
        {"say": "The stock market's long-run average of about seven percent? Around ten years.",
         "visual": {"kind": "stack", "lines": [{"text": "Stocks: ~7%", "size": 100},
                                               {"text": "~10 years", "size": 130, "accent": True, "at": 1.6}]},
         "sfx": [("whoosh", 0.0), ("pop", 1.6)]},
        {"say": "Same money. One choice makes it double seven times faster.",
         "visual": {"kind": "hero", "icon": "rocket"}},
        {"say": "Save this, and show it to someone who still keeps everything in a savings account.",
         "visual": {"kind": "cta", "text": "SAVE THIS"}, "sfx": [("pop", 0.1)]},
    ],
}
