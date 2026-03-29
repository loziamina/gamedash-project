def xp_needed_for_level(level: int):
    return 100 + max(level - 1, 0) * 50


def apply_progression(user, xp_gain: int, currency_gain: int):
    user.xp += xp_gain
    user.soft_currency += currency_gain

    level_ups = 0
    while user.xp >= xp_needed_for_level(user.level):
        user.xp -= xp_needed_for_level(user.level)
        user.level += 1
        user.soft_currency += 50
        level_ups += 1

    return {
        "xp_gain": xp_gain,
        "currency_gain": currency_gain,
        "level": user.level,
        "level_ups": level_ups,
        "xp_in_level": user.xp,
        "xp_needed": xp_needed_for_level(user.level),
    }
