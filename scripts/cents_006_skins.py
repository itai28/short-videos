"""Cents in Sixty #006 - game skins."""
from studio.channels import CENTS_IN_SIXTY
from studio.finance import future_value, future_value_of_contributions, money, spoken_thousands

MONTHLY, RATE = 10, 0.07
spent = MONTHLY * 12 * 10                                  # ages 13 to 23
at_23 = future_value_of_contributions(MONTHLY * 12, RATE, 10)
at_60 = future_value(at_23, RATE, 37)

TITLE = f"Those $10 game skins could cost you {money(at_60)}"
CAPTION = (f"$10 a month on skins from 13 to 23 = {money(spent)}. Invested at 7% instead, that's about {money(at_60)} by 60. "
           "Not saying stop gaming, just know the real price. (Illustration, not financial advice.) "
           "#money #personalfinance #gaming #fintok")

SPEC = {
    **CENTS_IN_SIXTY,
    "scenes": [
        {"say": f"That ten dollar skin might be costing you {spoken_thousands(at_60)} dollars.",
         "visual": {"kind": "hero", "icon": "gamepad", "big": money(at_60), "big_at": 0.6}, "sfx": [("pop", 0.6)]},
        {"say": "Ten dollars a month on skins, from age thirteen to twenty-three.",
         "visual": {"kind": "stack", "lines": [{"text": "$10 / month", "size": 120, "accent": True, "at": 0.4},
                                               {"text": "ages 13 to 23", "size": 90, "at": 2.0}]},
         "sfx": [("pop", 0.4), ("pop", 2.0)]},
        {"say": "That's twelve hundred dollars. Not bad for ten years of looking cool.",
         "visual": {"kind": "counter", "from": 0, "to": spent, "label": "spent on skins", "run": 1.2},
         "sfx": [("ding", 1.5)]},
        {"say": "But if you invested that same ten bucks a month instead, and then left it alone until sixty,",
         "visual": {"kind": "stack", "lines": [{"text": "Invest it", "size": 110, "accent": True}, {"text": "wait until 60", "size": 90, "at": 2.2}]},
         "sfx": [("whoosh", 0.0)]},
        {"say": f"you'd have around {spoken_thousands(at_60)} dollars.",
         "visual": {"kind": "counter", "from": spent, "to": at_60, "label": "at age 60", "start_at": 0.2, "run": 1.4, "coins": True},
         "sfx": [("ding", 1.6)]},
        {"say": "I'm not saying stop gaming. Maybe just skip one skin, and invest that one.",
         "visual": {"kind": "hero", "icon": "gamepad"}},
        {"say": "Send this to your friend with the most skins.",
         "visual": {"kind": "cta", "text": "TAG A GAMER"}, "sfx": [("pop", 0.1)]},
    ],
}
