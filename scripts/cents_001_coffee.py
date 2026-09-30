"""Cents in Sixty #001 - Receipt autopsy: the $6 coffee."""
from studio.channels import CENTS_IN_SIXTY
from studio.finance import money, spoken_dollars, spoken_thousands, yearly_balances

PRICE, DAYS_PER_YEAR, RATE, YEARS = 6, 5 * 52, 0.07, 30
yearly = PRICE * DAYS_PER_YEAR
balances = yearly_balances(yearly, RATE, YEARS)
final = balances[-1]

TITLE = f"Your $6 coffee costs {money(final)}"
CAPTION = (f"$6 a workday = {money(yearly)} a year. Invested at 7% for 30 years = {money(final)}. "
           "What's your daily habit? I'll run your numbers next. "
           "(Illustration assuming a 7% average yearly return. Not financial advice.) "
           "#money #personalfinance #investing #coffee")

SPEC = {
    **CENTS_IN_SIXTY,
    "scenes": [
        {"say": f"Your six dollar coffee is quietly costing you {spoken_thousands(final)} dollars.",
         "visual": {"kind": "hero", "big": "$6", "big_at": 0.5},
         "sfx": [("pop", 0.5)]},
        {"say": "Here's the math. Six bucks, five workdays a week, fifty-two weeks a year.",
         "visual": {"kind": "stack", "lines": [
             {"text": "$6", "size": 130, "accent": True, "at": 0.9},
             {"text": "x 5 days", "size": 100, "at": 1.9},
             {"text": "x 52 weeks", "size": 100, "at": 3.0}]},
         "sfx": [("pop", 0.9), ("pop", 1.9), ("pop", 3.0)]},
        {"say": f"That's {spoken_dollars(yearly)} a year. Doesn't sound like much, right?",
         "visual": {"kind": "counter", "from": 0, "to": yearly, "label": "per year", "run": 1.2},
         "sfx": [("whoosh", 0.0), ("ding", 1.5)]},
        {"say": "But put that same money into an index fund, earning about seven percent a year.",
         "visual": {"kind": "stack", "lines": [
             {"text": "Index fund", "size": 100, "at": 1.2},
             {"text": "~7% / year", "size": 110, "accent": True, "at": 2.8}]},
         "sfx": [("whoosh", 0.0), ("pop", 2.8)]},
        {"say": f"After ten years, you'd have about {spoken_thousands(balances[10])}. "
                f"After twenty, around {spoken_thousands(balances[20])}.",
         "visual": {"kind": "chart", "values": balances[1:21], "marks": {0: "Yr 1", 9: "Yr 10", 19: "Yr 20"}},
         "sfx": [("whoosh", 0.0)]},
        {"say": f"And after thirty years? {spoken_thousands(final).capitalize()} dollars. From coffee.",
         "visual": {"kind": "counter", "from": balances[20], "to": final, "label": "after 30 years",
                    "start_at": 0.8, "run": 1.4, "coins": True},
         "sfx": [("whoosh", 0.0), ("ding", 2.2)]},
        {"say": "I'm not telling you to quit coffee. I'm telling you to know what it really costs.",
         "visual": {"kind": "hero"}},
        {"say": "Drop your daily habit in the comments, and I'll run your numbers next. Follow for more.",
         "visual": {"kind": "cta", "text": "FOLLOW"},
         "sfx": [("pop", 0.1)]},
    ],
}
