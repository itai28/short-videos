"""Cents in Sixty #001 - the $6 coffee."""
from studio.channels import CENTS_IN_SIXTY
from studio.finance import money, yearly_balances

PRICE, DAYS_PER_YEAR, RATE, YEARS = 6, 5 * 52, 0.07, 30
yearly = PRICE * DAYS_PER_YEAR
balances = yearly_balances(yearly, RATE, YEARS)
final = balances[-1]
HOOK = {"kind": "pair", "small": "$6 coffee", "big": money(final), "label": "every workday, 30 yrs"}

TITLE = f"Invest a $6 daily coffee for 30 years: {money(final)}"
CAPTION = (f"$6 every workday = {money(yearly)}/yr. Invested at an assumed 7% average yearly return: "
           f"about {money(balances[10])} after 10 years, {money(balances[20])} after 20, {money(final)} after 30. "
           "What's your daily habit? Illustration only, returns not guaranteed. Not financial advice. "
           "#personalfinance #investing #compoundinterest #moneytips")

SPEC = {
    **CENTS_IN_SIXTY,
    "note": "assumes ~7%/yr average · not guaranteed",
    "scenes": [
        {"say": "This coffee costs way more than six dollars.", "speed": 1.18, "expr": "smug", "lean": True,
         "visual": HOOK, "sfx": [("ding", 0.0)]},
        {"say": "Six bucks every workday is fifteen hundred and sixty dollars a year.",
         "cap": f"$6 every workday is {money(yearly)} a year.",
         "visual": {"kind": "counter", "from": 0, "to": yearly, "label": "$6 x 5 days x 52 weeks", "start_at": 0.2, "run": 1.4},
         "sfx": [("ding", 1.6)]},
        {"say": "⚡ Now invest that instead, at an assumed seven percent average.", "expr": "smug", "note": True,
         "cap": "Now invest that instead, at an assumed 7% average.",
         "visual": {"kind": "stack", "lines": [{"text": "INVEST IT", "size": 150, "accent": True},
                                               {"text": "~7% / year", "size": 110, "at": 0.8}]},
         "sfx": [("pop", 0.8)]},
        {"say": "Ten years: twenty-two thousand. Twenty: sixty-four thousand.", "note": True,
         "cap": f"10 years: {money(balances[10])}. 20: {money(balances[20])}.",
         "visual": {"kind": "chart", "values": balances[1:21], "marks": {0: "Yr 1", 9: "Yr 10", 19: "Yr 20"}}},
        {"say": "Thirty years… ⏸ a hundred and forty-seven thousand dollars.", "speed": 1.0, "note": True,
         "cap": f"30 years… {money(final)}.",
         "visual": {"kind": "counter", "from": balances[20], "to": final, "label": "after 30 years",
                    "start_at": "reveal", "run": 0.7, "coins": True}},
        # Ends mid-sentence into the hook, so the replay finishes the thought.
        {"say": "I'm not saying give up coffee. Just know the real price, because…", "expr": "smug", "visual": HOOK},
    ],
}
