def get_rank(elo: int):
    if elo < 1000:
        return "Bronze"
    if elo < 1200:
        return "Silver"
    if elo < 1400:
        return "Gold"
    if elo < 1600:
        return "Platinum"
    return "Diamond"
