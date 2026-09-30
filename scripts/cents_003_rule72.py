"""Cents in Sixty #003 - the Rule of 72."""
from studio.channels import CENTS_IN_SIXTY
from studio.finance import future_value, money

at_1 = future_value(1000, 0.01, 72)
at_7 = future_value(1000, 0.07, 72)

TITLE = "Is your savings account taking 72 years to double your money?"
CAPTION = (f"Rule of 72: 72 ÷ interest rate ≈ years to double. 1% → about 72 years. 7% → about 10 years. "
           f"$1,000 left for 72 years: {money(at_1)} at 1% vs {money(at_7)} at 7%. "
           "7% is an assumed long-run stock average, not guaranteed; markets can drop. Not financial advice. "
           "#ruleof72 #investing #personalfinance #moneytips")

SPEC = {
    **CENTS_IN_SIXTY,
    "note": "7% = historical average, not guaranteed",
    "scenes": [
        {"say": "Your savings account might take seventy-two years to double your money.", "speed": 1.15, "lean": True,
         "expr": "shocked", "cap": "Your savings account might take 72 years to double your money.",
         "visual": {"kind": "stack", "lines": [{"text": "72 YEARS", "size": 200, "accent": True},
                                               {"text": "to double?!", "size": 110, "at": 0.6}]},
         "sfx": [("ding", 0.0), ("pop", 0.6)]},
        {"say": "Save this. Here's how to check any account in two seconds.", "expr": "smug",
         "cap": "Save this. Here's how to check any account in 2 seconds.",
         "visual": {"kind": "stack", "lines": [{"text": "SAVE THIS", "size": 150, "accent": True},
                                               {"text": "2-second check", "size": 100, "at": 0.8}]},
         "sfx": [("pop", 0.8)]},
        {"say": "Seventy-two, divided by the interest rate, is the years to double.",
         "cap": "72, divided by the interest rate, is the years to double.",
         "visual": {"kind": "stack", "lines": [{"text": "72 ÷ rate", "size": 160, "accent": True},
                                               {"text": "= years to double", "size": 96, "at": 1.2}]},
         "sfx": [("pop", 1.2)]},
        {"say": "Savings paying one percent? Seventy-two years.", "expr": "worried",
         "cap": "Savings paying 1%? 72 years.",
         "visual": {"kind": "stack", "lines": [{"text": "1%", "size": 150}, {"text": "72 years", "size": 150, "accent": True, "at": 0.9}]},
         "sfx": [("pop", 0.9)]},
        {"say": "⚡ Seven percent, like the stock market's long-run average? About ten years.", "note": True,
         "cap": "7%, like the stock market's long-run average? About 10 years.",
         "visual": {"kind": "stack", "lines": [{"text": "~7%", "size": 150}, {"text": "~10 years", "size": 150, "accent": True, "at": 0.8}]},
         "sfx": [("pop", 0.8)]},
        {"say": "A thousand dollars, left seventy-two years. ⏸ Two thousand, versus a hundred and thirty thousand.",
         "note": True, "cap": f"$1,000, left 72 years. {money(at_1)}, versus {money(at_7)}.",
         "visual": {"kind": "race", "lanes": [{"label": "$1,000 at 1%", "to": at_1, "from": 1000},
                                              {"label": "$1,000 at 7%", "to": at_7, "from": 1000}],
                    "start_at": "reveal", "run": 1.0, "verdict": f"{at_7 / at_1:.0f}x more"}},
        {"say": "Now go check yours. Because…", "expr": "hype",
         "visual": {"kind": "cta", "text": "CHECK YOUR RATE"}, "sfx": [("pop", 0.1)]},
    ],
}
