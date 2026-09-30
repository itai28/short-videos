"""Cents in Sixty #004 - the credit card minimum-payment trap."""
from studio.channels import CENTS_IN_SIXTY
from studio.finance import money


def payoff(balance, monthly_rate, payment):
    """Months and total paid to clear a card balance with a fixed payment and no new charges."""
    months = paid = 0
    while balance > 0:
        balance *= 1 + monthly_rate
        p = min(payment, balance)
        balance -= p
        paid += p
        months += 1
    return months, paid


BALANCE, APR = 1000, 0.24
months, paid = payoff(BALANCE, APR / 12, 25)
months_50, paid_50 = payoff(BALANCE, APR / 12, 50)
first_interest = BALANCE * APR / 12
HOOK = {"kind": "pair", "small": "$1,000 card", "big": "???", "label": "paying $25 a month"}

TITLE = f"$1,000 on a credit card at $25/month takes {months} months to pay off"
CAPTION = (f"Example: {money(BALANCE)} balance, 24% APR (2% a month), fixed $25 monthly payment, no new charges: "
           f"{months} months (almost 7 years) and about {money(paid)} paid, {money(paid - BALANCE)} of it interest. "
           f"At $50/month: {months_50} months, about {money(paid_50)}. Your card's terms may differ. Not financial advice. "
           "#creditcard #debt #personalfinance #moneytips")

SPEC = {
    **CENTS_IN_SIXTY,
    "note": "example: 24% APR, $25/mo, no new charges",
    "scenes": [
        {"say": "Pay twenty-five bucks a month on a thousand-dollar credit card. Guess when you're free.",
         "speed": 1.18, "lean": True, "expr": "smug",
         "cap": "Pay $25 a month on a $1,000 credit card. Guess when you're free.",
         "visual": HOOK, "sfx": [("ding", 0.0)]},
        {"say": "The card charges twenty-four percent a year. About two percent, every month.", "note": True,
         "cap": "The card charges 24% a year. About 2%, every month.",
         "visual": {"kind": "stack", "lines": [{"text": "24% a year", "size": 140, "accent": True},
                                               {"text": "= 2% every month", "size": 100, "at": 1.4}]},
         "sfx": [("pop", 1.4)]},
        {"say": "⚡ Month one, twenty of your twenty-five bucks is just interest.", "expr": "worried", "note": True,
         "cap": f"Month one, ${first_interest:.0f} of your $25 is just interest.",
         "visual": {"kind": "stack", "lines": [{"text": "You pay $25", "size": 110},
                                               {"text": f"${first_interest:.0f} = interest", "size": 130, "accent": True, "at": 1.0}]},
         "sfx": [("pop", 1.0)]},
        {"say": "So how long until it's gone?", "hold": 1.4, "expr": "worried",
         "visual": {"kind": "guess", "title": "PAID OFF IN?", "options": ["2 years", "almost 7 years", "4 years"], "answer": 1}},
        {"say": "Eighty-two months… ⏸ almost seven years.", "speed": 1.0, "note": True,
         "cap": f"{months} months… almost 7 years.",
         "visual": {"kind": "counter", "from": 0, "to": months, "unit": "months", "label": "to pay it off",
                    "start_at": "reveal", "run": 0.7}},
        {"say": "You'd pay back about two thousand. Over a thousand of it is interest.", "expr": "shocked", "note": True,
         "cap": f"You'd pay back about {money(paid)}. Over $1,000 of it is interest.",
         "visual": {"kind": "race", "lanes": [{"label": "You borrowed", "to": BALANCE},
                                              {"label": "You paid back", "to": paid}],
                    "run": 1.2, "verdict": f"+{money(paid - BALANCE)} interest"}},
        {"say": "Pay fifty a month instead? Twenty-six months.", "expr": "smug", "note": True,
         "cap": f"Pay $50 a month instead? {months_50} months.",
         "visual": {"kind": "stack", "lines": [{"text": "$50 / month", "size": 120},
                                               {"text": f"{months_50} months", "size": 150, "accent": True, "at": 1.1}]},
         "sfx": [("pop", 1.1)]},
        {"say": "Show a parent, and ask what their card's rate is. Because…", "expr": "hype",
         "visual": {"kind": "cta", "text": "SHOW A PARENT"}},
    ],
}
