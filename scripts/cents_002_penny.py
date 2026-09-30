"""Cents in Sixty #002 - $1M now or a doubling penny?"""
from studio.channels import CENTS_IN_SIXTY
from studio.finance import money

days = [0.01 * 2 ** d for d in range(30)]
final, day10, day20 = days[-1], days[9], days[19]

TITLE = "$1,000,000 now or a penny that doubles for 30 days?"
CAPTION = (f"1¢ on day 1, doubling daily: ${day10:,.2f} on day 10, ${day20:,.2f} on day 20, ${final:,.2f} on day 30. "
           "That's compounding. A or B? (A math illustration; real investments don't double daily. Not financial advice.) "
           "#compoundinterest #math #personalfinance #moneytips")

SPEC = {
    **CENTS_IN_SIXTY,
    "scenes": [
        {"say": "A million dollars now… or one penny that doubles every day for thirty days?", "speed": 1.18,
         "lean": True, "expr": "smug", "cap": "$1,000,000 now… or 1¢ that doubles every day for 30 days?",
         "visual": {"kind": "stack", "lines": [{"text": "A) $1,000,000", "size": 110},
                                               {"text": "B) 1¢, doubling", "size": 110, "accent": True, "at": 0.6},
                                               {"text": "for 30 days", "size": 90, "at": 1.4}]},
         "sfx": [("pop", 0.0), ("pop", 0.6), ("pop", 1.4)]},
        {"say": "Your gut says A.", "expr": "smug",
         "visual": {"kind": "stack", "lines": [{"text": "Your gut says", "size": 100}, {"text": "A", "size": 280, "accent": True, "at": 0.4}]},
         "sfx": [("pop", 0.4)]},
        {"say": "On day ten: five dollars. On day twenty: fifty-two hundred.",
         "cap": f"On day 10: ${day10:.2f}. On day 20: {money(day20)}.",
         "visual": {"kind": "chart", "values": days[:20], "marks": {0: "Day 1", 9: "Day 10", 19: "Day 20"}}},
        {"say": "⚡ Ten days left, and the penny's losing by almost a million.", "expr": "worried",
         "cap": "10 days left, and the penny's losing by almost $1M.",
         "visual": {"kind": "race", "lanes": [{"label": "A) the million", "to": 1_000_000, "from": 1_000_000},
                                              {"label": "B) the penny, day 20", "to": day20, "from": 0}],
                    "run": 1.2, "verdict": f"-{money(1_000_000 - day20)}"}},
        {"say": "Lock in your guess for day thirty.", "hold": 1.4, "cap": "Lock in your guess for day 30.", "expr": "worried",
         "visual": {"kind": "guess", "title": "DAY 30?", "options": ["$900,000", "$5.4 million", "$54 million"], "answer": 1}},
        {"say": "Day thirty… ⏸ five point four million.", "speed": 1.0, "cap": f"Day 30… {money(final)}.",
         "visual": {"kind": "counter", "from": day20, "to": final, "label": "day 30", "start_at": "reveal", "run": 0.7, "coins": True}},
        {"say": "That's compounding. So, A or B? One letter in the comments.", "expr": "hype",
         "visual": {"kind": "cta", "text": "A or B?"}, "sfx": [("pop", 0.1)]},
    ],
}
