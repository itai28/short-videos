"""Cents in Sixty #002 - $1M now or a doubling penny?"""
from studio.channels import CENTS_IN_SIXTY
from studio.finance import money, spoken_millions, spoken_dollars

days = [0.01 * 2 ** d for d in range(30)]
final, day20 = days[-1], days[19]

TITLE = "$1,000,000 now or a penny that doubles for 30 days?"
CAPTION = (f"A penny doubled every day for 30 days = {money(final)}. On day 20 it's only {money(day20)}. "
           "That's compounding. Which one did you pick? #money #personalfinance #fintok #compoundinterest")

SPEC = {
    **CENTS_IN_SIXTY,
    "scenes": [
        {"say": "Would you take one million dollars right now, or a penny that doubles every day for thirty days?",
         "visual": {"kind": "stack", "lines": [
             {"text": "A) $1,000,000", "size": 96, "at": 0.3},
             {"text": "or", "size": 70, "at": 1.6},
             {"text": "B) 1¢ x 2 daily", "size": 96, "accent": True, "at": 2.6}]},
         "sfx": [("pop", 0.3), ("pop", 2.6)]},
        {"say": "Most people grab the million. Let's see if that's smart.",
         "visual": {"kind": "hero", "icon": "penny"}, "sfx": [("whoosh", 0.0)]},
        {"say": f"On day ten, your penny is worth five dollars and twelve cents. Day twenty? Only {spoken_dollars(day20)}.",
         "visual": {"kind": "chart", "values": days[:20], "marks": {0: "Day 1", 9: "Day 10", 19: "Day 20"}},
         "sfx": [("whoosh", 0.0)]},
        {"say": "Looks like a terrible deal, right? But watch the last ten days.",
         "visual": {"kind": "stack", "lines": [{"text": "Day 20", "size": 90}, {"text": money(day20), "size": 130, "accent": True, "at": 0.6}]},
         "sfx": [("pop", 0.6)]},
        {"say": f"On day thirty, that penny is worth {spoken_millions(final)} dollars.",
         "visual": {"kind": "counter", "from": day20, "to": final, "label": "Day 30", "start_at": 0.4, "run": 1.8, "coins": True},
         "sfx": [("whoosh", 0.0), ("ding", 2.2)]},
        {"say": "That's compounding. Slow at first, then it explodes. Time matters more than money.",
         "visual": {"kind": "hero", "icon": "rocket"}},
        {"say": "Be honest. Which one did you pick? A or B? Tell me in the comments.",
         "visual": {"kind": "cta", "text": "A or B?"}, "sfx": [("pop", 0.1)]},
    ],
}
