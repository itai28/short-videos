"""Money math used in scripts, so every on-screen number is computed, not typed."""


def future_value_of_contributions(yearly, rate, years):
    """Value after `years` of investing `yearly` at the end of each year, growing at `rate`."""
    return yearly * ((1 + rate) ** years - 1) / rate


def yearly_balances(yearly, rate, years):
    return [future_value_of_contributions(yearly, rate, y) for y in range(years + 1)]


def money(x):
    return f"${x:,.0f}"


_ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
_TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()


def _under_1000(n):
    parts = []
    if n >= 100:
        parts.append(f"{'a' if n // 100 == 1 else _ONES[n // 100]} hundred")
        n %= 100
        if n:
            parts.append("and")
    if n >= 20:
        parts.append(_TENS[n // 10] + (f"-{_ONES[n % 10]}" if n % 10 else ""))
    elif n or not parts:
        parts.append(_ONES[n])
    return " ".join(parts)


def spoken_thousands(x):
    """147359 -> 'a hundred and forty-seven thousand' (rounded, for voiceover)."""
    k = round(x / 1000)
    return f"{_under_1000(k)} thousand"


def spoken_dollars(x):
    """1560 -> 'fifteen hundred and sixty dollars' style for small amounts."""
    n = round(x)
    if 1000 < n < 10000 and (n // 100) % 10:
        head, rest = n // 100, n % 100
        return f"{_under_1000(head)} hundred" + (f" and {_under_1000(rest)}" if rest else "") + " dollars"
    return f"{_under_1000(n)} dollars" if n < 1000 else f"{spoken_thousands(n)} dollars"


def future_value(amount, rate, years):
    return amount * (1 + rate) ** years


def yearly_needed(target, rate, years):
    """Yearly contribution that grows to `target` after `years`."""
    return target * rate / ((1 + rate) ** years - 1)


def spoken_millions(x):
    """5368709 -> 'five point four million'."""
    whole, tenth = divmod(round(x / 100000), 10)
    return f"{_under_1000(whole)} point {_ONES[tenth]} million" if tenth else f"{_under_1000(whole)} million"
