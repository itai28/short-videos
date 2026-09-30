"""Cents in Sixty #001 - Receipt autopsy: the $6 coffee."""
from studio.channels import CENTS_IN_SIXTY
from studio.finance import money, yearly_balances

PRICE, DAYS_PER_YEAR, RATE, YEARS = 6, 5 * 52, 0.07, 30
yearly = PRICE * DAYS_PER_YEAR
balances = yearly_balances(yearly, RATE, YEARS)
final = balances[-1]

TITLE = f"Your $6 coffee costs {money(final)}"
CAPTION = (f"$6 a workday is {money(yearly)} a year. Invested at 7% for 30 years, that's {money(final)}. "
           "Not saying quit coffee, just know the price. #money #personalfinance #investing")

SPEC = {
    **CENTS_IN_SIXTY,
    "disclaimer": "Illustration: assumes 7% average yearly return, invested once a year. Not financial advice.",
    "scenes": [
        {"type": "text", "dur": 3.5, "lines": [
            {"text": "Your $6 coffee", "size": 110},
            {"text": "really costs", "size": 80, "at": 0.4},
            {"text": "{}", "count_to": round(final), "prefix": "$", "size": 150, "color": "accent", "at": 0.8, "count_dur": 2.2},
        ]},
        {"type": "text", "dur": 4, "lines": [
            {"text": "$6", "size": 150, "color": "accent"},
            {"text": "x 5 workdays x 52 weeks", "size": 70, "at": 0.5},
            {"text": f"= {money(yearly)} a year", "size": 100, "at": 1.4},
        ]},
        {"type": "text", "dur": 4, "lines": [
            {"text": "Now invest it instead", "size": 90},
            {"text": "at 7% a year", "size": 90, "color": "accent", "at": 0.6},
            {"text": "(about the long-run stock market average after inflation)", "size": 46, "at": 1.4},
        ]},
        {"type": "bars", "dur": 7, "title": "Your coffee money, invested", "values": balances[1:],
         "labels": {0: "Yr 1", 9: "Yr 10", 19: "Yr 20", 29: "Yr 30"}},
        {"type": "text", "dur": 5, "lines": [
            {"text": f"Year 10: {money(balances[10])}", "size": 80},
            {"text": f"Year 20: {money(balances[20])}", "size": 80, "at": 0.6},
            {"text": f"Year 30: {money(balances[30])}", "size": 100, "color": "accent", "at": 1.2},
        ]},
        {"type": "text", "dur": 4.5, "lines": [
            {"text": "Not saying quit coffee.", "size": 90},
            {"text": "Just know the price.", "size": 90, "color": "accent", "at": 0.8},
        ]},
        {"type": "text", "dur": 3, "lines": [
            {"text": "What's your $6 habit?", "size": 90},
            {"text": "Comment it. I'll run the numbers.", "size": 60, "color": "accent", "at": 0.5},
        ]},
    ],
}
