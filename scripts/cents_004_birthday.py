"""Cents in Sixty #004 - birthday money."""
from studio.channels import CENTS_IN_SIXTY
from studio.finance import future_value, future_value_of_contributions, money, spoken_thousands, spoken_dollars

GIFT, RATE = 200, 0.07
at_18 = future_value_of_contributions(GIFT, RATE, 6)        # birthdays 13 through 18
at_60 = future_value(at_18, RATE, 42)
growth = [future_value(at_18, RATE, y) for y in range(0, 43, 2)]

TITLE = f"Your birthday money could be worth {money(at_60)}"
CAPTION = (f"Invest $200 of birthday money every year from 13 to 18 ({money(GIFT * 6)} total) and never touch it. "
           f"At 7% a year it's about {money(at_60)} by 60. Show your parents. "
           "(Illustration, 7% average yearly return assumed. Not financial advice.) #money #personalfinance #fintok #investing")

SPEC = {
    **CENTS_IN_SIXTY,
    "scenes": [
        {"say": f"Your birthday money could be worth {spoken_thousands(at_60)} dollars. Here's how.",
         "visual": {"kind": "hero", "icon": "gift", "big": money(at_60), "big_at": 0.6}, "sfx": [("pop", 0.6)]},
        {"say": "Say you get two hundred dollars every birthday, from thirteen to eighteen.",
         "visual": {"kind": "stack", "lines": [{"text": "$200", "size": 140, "accent": True, "at": 0.8},
                                               {"text": "ages 13 to 18", "size": 90, "at": 2.2}]},
         "sfx": [("pop", 0.8), ("pop", 2.2)]},
        {"say": f"Instead of spending it, you invest it. That's only {spoken_dollars(GIFT * 6)} total.",
         "visual": {"kind": "counter", "from": 0, "to": GIFT * 6, "label": "total put in", "run": 1.2},
         "sfx": [("ding", 1.6)]},
        {"say": "Then you never add another cent. You just leave it alone, earning about seven percent a year.",
         "visual": {"kind": "chart", "values": growth, "marks": {0: "18", 10: "38", 21: "60"}},
         "sfx": [("whoosh", 0.0)]},
        {"say": f"By sixty, it's around {spoken_thousands(at_60)} dollars. From birthday money.",
         "visual": {"kind": "counter", "from": GIFT * 6, "to": at_60, "label": "at age 60", "start_at": 0.4, "run": 1.6, "coins": True},
         "sfx": [("whoosh", 0.0), ("ding", 2.0)]},
        {"say": "The trick isn't having a lot of money. It's starting early.",
         "visual": {"kind": "hero", "icon": "rocket"}},
        {"say": "Show this to your parents, and ask them to help you open an account.",
         "visual": {"kind": "cta", "text": "SHOW YOUR PARENTS"}, "sfx": [("pop", 0.1)]},
    ],
}
