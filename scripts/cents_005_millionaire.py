"""Cents in Sixty #005 - millionaire for under $10 a day."""
from studio.channels import CENTS_IN_SIXTY
from studio.finance import money, yearly_balances, yearly_needed

RATE = 0.07
yearly_15 = yearly_needed(1_000_000, RATE, 45)
yearly_35 = yearly_needed(1_000_000, RATE, 25)
daily_15, daily_35 = yearly_15 / 365, yearly_35 / 365
put_in_15, put_in_35 = yearly_15 * 45, yearly_35 * 25
balances = yearly_balances(yearly_15, RATE, 45)

TITLE = f"${daily_15:.2f} a day from age 15 could make you a millionaire by 60"
CAPTION = (f"{money(yearly_15)} a year (${daily_15:.2f}/day) from 15 to 60 at an assumed 7% return = $1,000,000. "
           f"You put in {money(put_in_15)}; {money(1_000_000 - put_in_15)} is growth. Start at 35 and it's about ${daily_35:.2f}/day. "
           "Not adjusted for inflation. Not financial advice. #investing #compoundinterest #personalfinance #millionaire")

NOTE = "~7%/yr assumed · not inflation-adjusted"

SPEC = {
    **CENTS_IN_SIXTY,
    "note": NOTE,
    "scenes": [
        {"say": "A million dollars. Under ten bucks a day.", "speed": 1.18, "lean": True, "expr": "smug",
         "cap": "$1,000,000. Under $10 a day.",
         "visual": {"kind": "pair", "small": f"${daily_15:.2f}/day", "big": "$1,000,000", "label": "age 15 to 60"},
         "sfx": [("ding", 0.0)]},
        {"say": "Start at fifteen. Invest about nine dollars sixty a day, at an assumed seven percent average.", "note": True,
         "cap": f"Start at 15. Invest about ${daily_15:.2f} a day, at an assumed 7% average.",
         "visual": {"kind": "stack", "lines": [{"text": "Age 15", "size": 120}, {"text": f"${daily_15:.2f} / day", "size": 150, "accent": True, "at": 1.0}]},
         "sfx": [("pop", 1.0)]},
        {"say": "Then just… don't touch it.", "note": True,
         "visual": {"kind": "chart", "values": balances[:36], "marks": {0: "15", 20: "35", 35: "50"}}},
        {"say": "At sixty… ⏸ one million dollars.", "speed": 1.0, "cap": "At 60… $1,000,000.", "note": True,
         "visual": {"kind": "counter", "from": balances[35], "to": 1_000_000, "label": "at age 60", "start_at": "reveal", "run": 0.7, "coins": True}},
        {"say": "⚡ Wait. You only put in about a hundred and fifty-seven thousand. The rest? Growth.",
         "cap": f"Wait. You only put in {money(put_in_15)}. The rest? Growth.", "expr": "shocked", "note": True,
         "visual": {"kind": "stack", "lines": [{"text": f"You: {money(put_in_15)}", "size": 100},
                                               {"text": f"Growth: {money(1_000_000 - put_in_15)}", "size": 110, "accent": True, "at": 2.0}]},
         "sfx": [("pop", 2.0)]},
        {"say": "Start at thirty-five instead? About forty-three dollars a day.", "expr": "worried", "note": True,
         "cap": f"Start at 35 instead? About ${daily_35:.2f} a day.",
         "visual": {"kind": "race", "lanes": [{"label": "Start at 15: you put in", "to": put_in_15},
                                              {"label": "Start at 35: you put in", "to": put_in_35}],
                    "run": 1.2, "verdict": f"{put_in_35 / put_in_15:.1f}x more"}},
        {"say": "Send this to the friend who says they'll start later. Because…", "expr": "hype",
         "visual": {"kind": "cta", "text": "SEND IT"}, "sfx": [("pop", 0.1)]},
    ],
}
