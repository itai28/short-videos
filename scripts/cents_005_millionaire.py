"""Cents in Sixty #005 - millionaire for under $10 a day."""
from studio.channels import CENTS_IN_SIXTY
from studio.finance import money, yearly_balances, yearly_needed

RATE, YEARS = 0.07, 45                 # age 15 to 60
yearly = yearly_needed(1_000_000, RATE, YEARS)
daily = yearly / 365
balances = yearly_balances(yearly, RATE, YEARS)

TITLE = "Becoming a millionaire costs less than $10 a day"
CAPTION = (f"Invest ${daily:.2f} a day from age 15 and at 7% a year you hit $1,000,000 by 60. "
           "Start at 35 and you'd need way more. Time is the cheat code. "
           "(Illustration, not financial advice.) #money #personalfinance #fintok #millionaire")

SPEC = {
    **CENTS_IN_SIXTY,
    "scenes": [
        {"say": "Becoming a millionaire costs less than ten dollars a day. Seriously.",
         "visual": {"kind": "stack", "lines": [{"text": "$1,000,000", "size": 130, "accent": True, "at": 0.3},
                                               {"text": "< $10 / day", "size": 110, "at": 1.8}]},
         "sfx": [("pop", 0.3), ("pop", 1.8)]},
        {"say": "Start at fifteen. Put away about nine dollars and sixty cents a day.",
         "visual": {"kind": "stack", "lines": [{"text": "Age 15", "size": 100}, {"text": f"${daily:.2f} / day", "size": 120, "accent": True, "at": 1.2}]},
         "sfx": [("pop", 1.2)]},
        {"say": "Invest it every year, and let it grow at about seven percent.",
         "visual": {"kind": "chart", "values": balances[1:], "marks": {0: "15", 20: "35", 44: "60"}},
         "sfx": [("whoosh", 0.0)]},
        {"say": "By sixty, you've got one million dollars.",
         "visual": {"kind": "counter", "from": balances[35], "to": 1_000_000, "label": "at age 60", "start_at": 0.2, "run": 1.4, "coins": True},
         "sfx": [("ding", 1.6)]},
        {"say": "Here's the crazy part. Most of that million is growth, not money you put in.",
         "visual": {"kind": "stack", "lines": [{"text": f"You put in {money(yearly * YEARS)}", "size": 70},
                                               {"text": f"Growth: {money(1_000_000 - yearly * YEARS)}", "size": 80, "accent": True, "at": 1.6}]},
         "sfx": [("pop", 1.6)]},
        {"say": "The earlier you start, the less you need. Time does the heavy lifting.",
         "visual": {"kind": "hero", "icon": "rocket"}},
        {"say": "Send this to a friend who says they'll start saving later.",
         "visual": {"kind": "cta", "text": "SEND TO A FRIEND"}, "sfx": [("pop", 0.1)]},
    ],
}
