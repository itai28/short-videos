"""Cents in Sixty #006 - game skins."""
from studio.channels import CENTS_IN_SIXTY
from studio.finance import future_value, future_value_of_contributions, money

MONTHLY, RATE = 10, 0.07
spent = MONTHLY * 12 * 10                                  # ages 13 to 23
at_23 = future_value_of_contributions(MONTHLY * 12, RATE, 10)
at_60 = future_value(at_23, RATE, 37)

HOOK = {"kind": "pair", "small": "$10/mo on skins", "big": "???", "label": "ages 13 to 23"}

TITLE = f"$10/month on skins, ages 13–23, invested instead = {money(at_60)}"
CAPTION = (f"$10 a month for 10 years = {money(spent)}. Invested at an assumed 7% average yearly return and left alone "
           f"until 60 = about {money(at_60)}. Keep gaming, just know the trade-off. Under 18? You'll need a parent to "
           "open an investing account. Not financial advice. #gaming #personalfinance #investing #moneytips")

SPEC = {
    **CENTS_IN_SIXTY,
    "note": "assumes ~7%/yr average · not guaranteed",
    "scenes": [
        {"say": "Ten bucks a month on skins. Guess what that could've been.", "speed": 1.18, "lean": True, "expr": "smug",
         "cap": "$10 a month on skins. Guess what that could've been.", "visual": HOOK, "sfx": [("ding", 0.0)]},
        {"say": "From thirteen to twenty-three, that's twelve hundred dollars. Gone.", "expr": "worried",
         "cap": f"From 13 to 23, that's {money(spent)}. Gone.",
         "visual": {"kind": "counter", "from": 0, "to": spent, "label": "spent on skins", "start_at": 0.3, "run": 1.2},
         "sfx": [("ding", 1.5)]},
        {"say": "⚡ But here's the twist. Invest it instead, at an assumed seven percent average, and don't touch it till sixty.",
         "expr": "smug", "note": True,
         "cap": "But here's the twist. Invest it instead, at an assumed 7% average, and don't touch it till 60.",
         "visual": {"kind": "stack", "lines": [{"text": "INVEST IT", "size": 140, "accent": True}, {"text": "wait until 60", "size": 110, "at": 1.6}]},
         "sfx": [("pop", 1.6)]},
        {"say": "Lock in your guess.", "hold": 1.6, "expr": "worried",
         "visual": {"kind": "guess", "title": "AT AGE 60?", "options": ["$2,000", money(at_60), "$60,000"], "answer": 1}},
        {"say": "⏸ About twenty thousand dollars.", "speed": 1.0, "cap": f"{money(at_60)}.", "note": True,
         "visual": {"kind": "counter", "from": spent, "to": at_60, "label": "at age 60", "start_at": "reveal", "run": 0.7, "coins": True}},
        {"say": "Keep gaming. Just tag the friend with the most skins. Because…", "expr": "hype",
         "visual": {"kind": "cta", "text": "TAG A GAMER"}},
    ],
}
