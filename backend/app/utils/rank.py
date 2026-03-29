from app.models.rank_settings import RankSettings


DEFAULT_RANK_SETTINGS = {
    "bronze_max": 999,
    "silver_min": 1000,
    "gold_min": 1200,
    "platinum_min": 1400,
    "diamond_min": 1600,
}


def get_rank_settings_payload(settings: RankSettings | None = None):
    if not settings:
      return DEFAULT_RANK_SETTINGS.copy()

    return {
        "bronze_max": settings.bronze_max,
        "silver_min": settings.silver_min,
        "gold_min": settings.gold_min,
        "platinum_min": settings.platinum_min,
        "diamond_min": settings.diamond_min,
    }


def get_rank_tier(elo: int, settings: RankSettings | None = None):
    values = get_rank_settings_payload(settings)

    if elo < values["silver_min"]:
        return "Bronze"
    if elo < values["gold_min"]:
        return "Silver"
    if elo < values["platinum_min"]:
        return "Gold"
    if elo < values["diamond_min"]:
        return "Platinum"
    return "Diamond"


def get_rank_division(elo: int, settings: RankSettings | None = None):
    tier = get_rank_tier(elo, settings)
    values = get_rank_settings_payload(settings)

    if tier == "Bronze":
        floor = 0
        ceiling = values["silver_min"]
    elif tier == "Silver":
        floor = values["silver_min"]
        ceiling = values["gold_min"]
    elif tier == "Gold":
        floor = values["gold_min"]
        ceiling = values["platinum_min"]
    elif tier == "Platinum":
        floor = values["platinum_min"]
        ceiling = values["diamond_min"]
    else:
        floor = values["diamond_min"]
        ceiling = max(values["diamond_min"] + 300, elo + 1)

    span = max(1, ceiling - floor)
    progress = min(max(elo - floor, 0), span - 1)
    chunk = span / 3

    if progress < chunk:
        return "III"
    if progress < 2 * chunk:
        return "II"
    return "I"


def get_rank_payload(elo: int, settings: RankSettings | None = None):
    tier = get_rank_tier(elo, settings)
    division = get_rank_division(elo, settings)
    return {
        "tier": tier,
        "division": division,
        "label": f"{tier} {division}",
    }


def get_rank(elo: int, settings: RankSettings | None = None):
    return get_rank_payload(elo, settings)["tier"]
