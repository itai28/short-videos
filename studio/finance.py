"""Money math used in scripts, so every on-screen number is computed, not typed."""


def future_value_of_contributions(yearly, rate, years):
    """Value after `years` of investing `yearly` at the end of each year, growing at `rate`."""
    return yearly * ((1 + rate) ** years - 1) / rate


def yearly_balances(yearly, rate, years):
    return [future_value_of_contributions(yearly, rate, y) for y in range(years + 1)]


def money(x):
    return f"${x:,.0f}"
