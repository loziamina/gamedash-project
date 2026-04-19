from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.map import Map
from app.models.map_comment import MapComment
from app.models.map_favorite import MapFavorite
from app.models.map_playtest import MapPlaytest
from app.models.map_report import MapReport
from app.models.map_vote import MapVote
from app.models.match import Match
from app.models.matchmaking_settings import MatchmakingSettings
from app.models.payment_transaction import PaymentTransaction
from app.models.queue import QueuePlayer
from app.models.rank_settings import RankSettings
from app.models.reward_settings import RewardSettings
from app.models.sanction_log import SanctionLog
from app.models.season_pass_tier import SeasonPassTier
from app.models.shop_item import ShopItem
from app.models.store_pack import StorePack
from app.models.user import User
from app.models.virtual_transaction import VirtualTransaction
from app.utils.economy import (
    build_transaction_feed,
    get_or_create_economy_settings,
    get_season_pass_tiers,
    serialize_economy_settings,
    serialize_pack,
    serialize_season_pass_tier,
    serialize_shop_item,
)
from app.utils.rank import get_rank_payload

router = APIRouter(prefix="/admin")


class MatchmakingSettingsPayload(BaseModel):
    max_elo_gap: int
    max_wait_seconds: int
    team_size: int
    ranked_enabled: bool
    unranked_enabled: bool
    fun_enabled: bool


class RankSettingsPayload(BaseModel):
    silver_min: int
    gold_min: int
    platinum_min: int
    diamond_min: int


class RewardSettingsPayload(BaseModel):
    win_xp: int
    loss_xp: int
    win_currency: int
    loss_currency: int
    daily_quest_bonus_xp: int
    weekly_quest_bonus_xp: int


class EconomySettingsPayload(BaseModel):
    starter_soft_currency: int
    starter_hard_currency: int
    season_name: str
    season_tier_xp: int
    premium_pass_price_hard: int
    stripe_enabled: bool
    paypal_enabled: bool


class ShopItemPayload(BaseModel):
    sku: str
    name: str
    description: str = ""
    category: str = "cosmetic"
    item_type: str = "avatar_frame"
    rarity: str = "rare"
    price_soft: int = 0
    price_hard: int = 0
    asset: str = ""
    season_tier_required: int = 0
    is_featured: bool = False
    is_active: bool = True


class StorePackPayload(BaseModel):
    sku: str
    name: str
    description: str = ""
    soft_currency: int = 0
    hard_currency: int = 0
    bonus_percent: int = 0
    price_cents: int = 499
    is_active: bool = True
    is_featured: bool = False


class SeasonPassTierPayload(BaseModel):
    tier: int
    xp_required: int = 0
    free_reward_type: str = "soft_currency"
    free_reward_amount: int = 0
    free_reward_sku: str = ""
    premium_reward_type: str = "soft_currency"
    premium_reward_amount: int = 0
    premium_reward_sku: str = ""
    is_active: bool = True


class ModerateMapPayload(BaseModel):
    featured: bool | None = None
    hidden: bool | None = None


def require_admin(user: User):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return user


def get_or_create_settings(db: Session) -> MatchmakingSettings:
    settings = db.query(MatchmakingSettings).first()
    if not settings:
        settings = MatchmakingSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def get_or_create_rank_settings(db: Session) -> RankSettings:
    settings = db.query(RankSettings).first()
    if not settings:
        settings = RankSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def get_or_create_reward_settings(db: Session) -> RewardSettings:
    settings = db.query(RewardSettings).first()
    if not settings:
        settings = RewardSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def serialize_settings(settings: MatchmakingSettings):
    return {
        "max_elo_gap": settings.max_elo_gap,
        "max_wait_seconds": settings.max_wait_seconds,
        "team_size": settings.team_size,
        "ranked_enabled": settings.ranked_enabled,
        "unranked_enabled": settings.unranked_enabled,
        "fun_enabled": settings.fun_enabled,
    }


def serialize_rank_settings(settings: RankSettings):
    return {
        "silver_min": settings.silver_min,
        "gold_min": settings.gold_min,
        "platinum_min": settings.platinum_min,
        "diamond_min": settings.diamond_min,
    }


def serialize_reward_settings(settings: RewardSettings):
    return {
        "win_xp": settings.win_xp,
        "loss_xp": settings.loss_xp,
        "win_currency": settings.win_currency,
        "loss_currency": settings.loss_currency,
        "daily_quest_bonus_xp": settings.daily_quest_bonus_xp,
        "weekly_quest_bonus_xp": settings.weekly_quest_bonus_xp,
    }


def serialize_admin_user(target: User):
    return {
        "id": target.id,
        "email": target.email,
        "role": target.role,
        "elo": target.elo,
        "active": target.is_active,
        "player_status": target.player_status,
        "level": target.level,
        "soft_currency": target.soft_currency,
        "hard_currency": target.hard_currency,
        "equipped_avatar_frame": target.equipped_avatar_frame,
        "equipped_title": target.equipped_title,
    }


def map_admin_payload(game_map: Map, db: Session):
    votes = db.query(MapVote).filter(MapVote.map_id == game_map.id).all()
    tests = db.query(MapPlaytest).filter(MapPlaytest.map_id == game_map.id).all()
    comments = db.query(MapComment).filter(MapComment.map_id == game_map.id).count()
    favorites = db.query(MapFavorite).filter(MapFavorite.map_id == game_map.id).count()
    reports = db.query(MapReport).filter(MapReport.map_id == game_map.id).count()
    author = db.query(User).filter(User.id == game_map.author_id).first()

    positive_votes = [vote.value for vote in votes if vote.value == 1]
    average_rating = round(((sum(votes and [vote.value for vote in votes] or [0]) / len(votes)) + 1) * 2.5, 2) if votes else 0
    average_test_duration = round(sum(test.duration_seconds for test in tests) / len(tests), 2) if tests else 0

    return {
        "id": game_map.id,
        "title": game_map.title,
        "author": author.pseudo if author else f"Player {game_map.author_id}",
        "status": game_map.status,
        "featured": game_map.featured,
        "hidden": game_map.hidden,
        "tests_count": game_map.tests_count,
        "average_rating": average_rating,
        "retention_score": round(game_map.retention_score or 0, 2),
        "last_updated_at": game_map.last_updated_at,
        "favorites": favorites,
        "comments": comments,
        "reports": reports,
        "score": len(positive_votes) - (len(votes) - len(positive_votes)),
        "average_test_duration": average_test_duration,
    }


@router.get("/stats")
def admin_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(user)

    now = datetime.utcnow()
    last_7_days = [now - timedelta(days=offset) for offset in range(6, -1, -1)]
    matches_per_day = []
    for day in last_7_days:
        next_day = day + timedelta(days=1)
        count = db.query(Match).filter(Match.created_at >= day, Match.created_at < next_day).count()
        matches_per_day.append({"day": day.strftime("%d/%m"), "matches": count})

    transactions = db.query(VirtualTransaction).all()
    maps = db.query(Map).all()
    rank_settings = get_or_create_rank_settings(db)

    rank_distribution = defaultdict(int)
    for target in db.query(User).all():
        rank_distribution[get_rank_payload(target.ranked_elo, rank_settings)["label"]] += 1

    return {
        "total_users": db.query(User).count(),
        "total_matches": db.query(Match).count(),
        "active_users": db.query(User).filter(User.is_active.is_(True)).count(),
        "players_online": db.query(User).filter(User.player_status == "online").count(),
        "players_in_queue": db.query(User).filter(User.player_status == "queue").count(),
        "players_in_game": db.query(User).filter(User.player_status == "in_game").count(),
        "virtual_revenue": sum(transaction.amount for transaction in transactions),
        "community_maps": len(maps),
        "featured_maps": len([game_map for game_map in maps if game_map.featured and not game_map.hidden]),
        "hidden_maps": len([game_map for game_map in maps if game_map.hidden]),
        "matches_per_day": matches_per_day,
        "rank_distribution": dict(rank_distribution),
    }


@router.get("/users")
def get_users(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(user)
    return [serialize_admin_user(target) for target in db.query(User).all()]


@router.get("/matchmaking-settings")
def get_matchmaking_settings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(user)
    return serialize_settings(get_or_create_settings(db))


@router.put("/matchmaking-settings")
def update_matchmaking_settings(
    payload: MatchmakingSettingsPayload,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(user)
    settings = get_or_create_settings(db)
    settings.max_elo_gap = max(0, payload.max_elo_gap)
    settings.max_wait_seconds = max(5, payload.max_wait_seconds)
    settings.team_size = max(1, payload.team_size)
    settings.ranked_enabled = payload.ranked_enabled
    settings.unranked_enabled = payload.unranked_enabled
    settings.fun_enabled = payload.fun_enabled
    db.commit()
    db.refresh(settings)
    return serialize_settings(settings)


@router.get("/rank-settings")
def get_rank_settings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(user)
    return serialize_rank_settings(get_or_create_rank_settings(db))


@router.put("/rank-settings")
def update_rank_settings(payload: RankSettingsPayload, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(user)
    settings = get_or_create_rank_settings(db)
    settings.silver_min = payload.silver_min
    settings.gold_min = max(payload.gold_min, payload.silver_min + 1)
    settings.platinum_min = max(payload.platinum_min, settings.gold_min + 1)
    settings.diamond_min = max(payload.diamond_min, settings.platinum_min + 1)
    settings.bronze_max = settings.silver_min - 1
    db.commit()
    db.refresh(settings)
    return serialize_rank_settings(settings)


@router.get("/reward-settings")
def get_reward_settings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(user)
    return serialize_reward_settings(get_or_create_reward_settings(db))


@router.put("/reward-settings")
def update_reward_settings(payload: RewardSettingsPayload, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(user)
    settings = get_or_create_reward_settings(db)
    settings.win_xp = payload.win_xp
    settings.loss_xp = payload.loss_xp
    settings.win_currency = payload.win_currency
    settings.loss_currency = payload.loss_currency
    settings.daily_quest_bonus_xp = payload.daily_quest_bonus_xp
    settings.weekly_quest_bonus_xp = payload.weekly_quest_bonus_xp
    db.commit()
    db.refresh(settings)
    return serialize_reward_settings(settings)


@router.get("/economy-settings")
def get_economy_settings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(user)
    return serialize_economy_settings(get_or_create_economy_settings(db))


@router.put("/economy-settings")
def update_economy_settings(payload: EconomySettingsPayload, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(user)
    settings = get_or_create_economy_settings(db)
    settings.starter_soft_currency = max(0, payload.starter_soft_currency)
    settings.starter_hard_currency = max(0, payload.starter_hard_currency)
    settings.season_name = payload.season_name.strip()
    settings.season_tier_xp = max(0, payload.season_tier_xp)
    settings.premium_pass_price_hard = max(0, payload.premium_pass_price_hard)
    settings.stripe_enabled = payload.stripe_enabled
    settings.paypal_enabled = payload.paypal_enabled
    db.commit()
    db.refresh(settings)
    return serialize_economy_settings(settings)


@router.get("/store-items")
def get_store_items(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(user)
    items = db.query(ShopItem).order_by(ShopItem.is_featured.desc(), ShopItem.name.asc()).all()
    return [serialize_shop_item(item) for item in items]


@router.post("/store-items")
def upsert_store_item(payload: ShopItemPayload, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(user)
    item = db.query(ShopItem).filter(ShopItem.sku == payload.sku).first()
    if not item:
        item = ShopItem(sku=payload.sku)
        db.add(item)

    item.name = payload.name
    item.description = payload.description
    item.category = payload.category
    item.item_type = payload.item_type
    item.rarity = payload.rarity
    item.price_soft = max(0, payload.price_soft)
    item.price_hard = max(0, payload.price_hard)
    item.asset = payload.asset
    item.season_tier_required = max(0, payload.season_tier_required)
    item.is_featured = payload.is_featured
    item.is_active = payload.is_active
    db.commit()
    db.refresh(item)
    return serialize_shop_item(item)


@router.get("/store-packs")
def get_store_packs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(user)
    packs = db.query(StorePack).order_by(StorePack.is_featured.desc(), StorePack.price_cents.asc()).all()
    return [serialize_pack(pack) for pack in packs]


@router.post("/store-packs")
def upsert_store_pack(payload: StorePackPayload, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(user)
    pack = db.query(StorePack).filter(StorePack.sku == payload.sku).first()
    if not pack:
        pack = StorePack(sku=payload.sku)
        db.add(pack)

    pack.name = payload.name
    pack.description = payload.description
    pack.soft_currency = max(0, payload.soft_currency)
    pack.hard_currency = max(0, payload.hard_currency)
    pack.bonus_percent = max(0, payload.bonus_percent)
    pack.price_cents = max(0, payload.price_cents)
    pack.is_active = payload.is_active
    pack.is_featured = payload.is_featured
    db.commit()
    db.refresh(pack)
    return serialize_pack(pack)


@router.get("/season-pass-tiers")
def admin_get_season_pass_tiers(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(user)
    return {"tiers": get_season_pass_tiers(db)}


@router.post("/season-pass-tiers")
def upsert_season_pass_tier(payload: SeasonPassTierPayload, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(user)
    season_pass_tier = db.query(SeasonPassTier).filter(SeasonPassTier.tier == payload.tier).first()
    if not season_pass_tier:
        season_pass_tier = SeasonPassTier(tier=payload.tier)
        db.add(season_pass_tier)

    season_pass_tier.xp_required = max(0, payload.xp_required)
    season_pass_tier.free_reward_type = payload.free_reward_type
    season_pass_tier.free_reward_amount = max(0, payload.free_reward_amount)
    season_pass_tier.free_reward_sku = payload.free_reward_sku.strip() or None
    season_pass_tier.premium_reward_type = payload.premium_reward_type
    season_pass_tier.premium_reward_amount = max(0, payload.premium_reward_amount)
    season_pass_tier.premium_reward_sku = payload.premium_reward_sku.strip() or None
    season_pass_tier.is_active = payload.is_active
    db.commit()
    db.refresh(season_pass_tier)
    return serialize_season_pass_tier(season_pass_tier)


@router.get("/economy-transactions")
def get_economy_transactions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(user)
    virtual_transactions = db.query(VirtualTransaction).order_by(VirtualTransaction.created_at.desc()).limit(100).all()
    payment_transactions = db.query(PaymentTransaction).order_by(PaymentTransaction.created_at.desc()).limit(100).all()
    return {"transactions": build_transaction_feed(virtual_transactions, payment_transactions)}


@router.get("/matchmaking-overview")
def get_matchmaking_overview(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(user)
    queue_players = (
        db.query(QueuePlayer)
        .filter(QueuePlayer.status == "waiting")
        .order_by(QueuePlayer.joined_at.asc())
        .all()
    )
    by_mode = {"ranked": [], "unranked": [], "fun": []}
    for queue_player in queue_players:
        player = db.query(User).filter(User.id == queue_player.user_id).first()
        by_mode.setdefault(queue_player.mode, []).append(
            {
                "user_id": queue_player.user_id,
                "pseudo": player.pseudo if player else f"Player {queue_player.user_id}",
                "elo": player.elo if player else 0,
                "mode": queue_player.mode,
                "joined_at": queue_player.joined_at,
            }
        )
    return {"settings": serialize_settings(get_or_create_settings(db)), "queue": by_mode}


@router.get("/sanctions")
def get_sanctions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(user)
    sanctions = db.query(SanctionLog).order_by(SanctionLog.created_at.desc()).all()
    return [
        {
            "id": sanction.id,
            "target_user_id": sanction.target_user_id,
            "actor_user_id": sanction.actor_user_id,
            "action": sanction.action,
            "reason": sanction.reason,
            "created_at": sanction.created_at,
        }
        for sanction in sanctions
    ]


@router.get("/maps/overview")
def maps_overview(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(user)

    maps = db.query(Map).all()
    visible_maps = [game_map for game_map in maps if not game_map.hidden]
    top_creators = defaultdict(lambda: {"maps": 0, "tests": 0, "score": 0})

    for game_map in maps:
        author = db.query(User).filter(User.id == game_map.author_id).first()
        name = author.pseudo if author else f"Player {game_map.author_id}"
        votes = db.query(MapVote).filter(MapVote.map_id == game_map.id).all()
        tests = db.query(MapPlaytest).filter(MapPlaytest.map_id == game_map.id).all()
        score = sum(vote.value for vote in votes)
        top_creators[name]["maps"] += 1
        top_creators[name]["tests"] += len(tests)
        top_creators[name]["score"] += score

    top_creators_payload = [
        {"creator": creator, **stats}
        for creator, stats in sorted(top_creators.items(), key=lambda item: (item[1]["score"], item[1]["tests"]), reverse=True)[:5]
    ]

    trending_maps = sorted(
        [map_admin_payload(game_map, db) for game_map in visible_maps],
        key=lambda item: (item["tests_count"] * 2 + item["favorites"] + item["score"]),
        reverse=True,
    )[:5]
    abandoned_maps = sorted(
        [map_admin_payload(game_map, db) for game_map in visible_maps],
        key=lambda item: (item["tests_count"], item["last_updated_at"] or datetime.min),
    )[:5]
    growth_maps = sorted(
        [map_admin_payload(game_map, db) for game_map in visible_maps],
        key=lambda item: (item["tests_count"] + item["favorites"] + item["comments"]),
        reverse=True,
    )[:5]

    return {
        "community_activity": {
            "total_maps": len(maps),
            "visible_maps": len(visible_maps),
            "featured_maps": len([game_map for game_map in maps if game_map.featured]),
            "hidden_maps": len([game_map for game_map in maps if game_map.hidden]),
            "reports_open": db.query(MapReport).filter(MapReport.status == "open").count(),
            "total_playtests": db.query(MapPlaytest).count(),
        },
        "top_creators": top_creators_payload,
        "trending_maps": trending_maps,
        "abandoned_maps": abandoned_maps,
        "growth_maps": growth_maps,
    }


@router.get("/maps")
def admin_maps(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(user)
    maps = db.query(Map).order_by(Map.last_updated_at.desc()).all()
    return [map_admin_payload(game_map, db) for game_map in maps]


@router.put("/maps/{map_id}/moderate")
def moderate_map(map_id: int, payload: ModerateMapPayload, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(user)
    game_map = db.query(Map).filter(Map.id == map_id).first()
    if not game_map:
        raise HTTPException(status_code=404, detail="Map not found")

    if payload.featured is not None:
        game_map.featured = payload.featured
        game_map.featured_at = datetime.utcnow() if payload.featured else None
    if payload.hidden is not None:
        game_map.hidden = payload.hidden

    game_map.last_updated_at = datetime.utcnow()
    db.commit()
    db.refresh(game_map)
    return map_admin_payload(game_map, db)


@router.post("/ban/{user_id}")
def ban_user(user_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(user)
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    target.is_active = False
    db.add(SanctionLog(target_user_id=target.id, actor_user_id=user.id, action="ban"))
    db.commit()
    return {"message": "User banned"}


@router.post("/unban/{user_id}")
def unban_user(user_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_admin(user)
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    target.is_active = True
    db.add(SanctionLog(target_user_id=target.id, actor_user_id=user.id, action="unban"))
    db.commit()
    return {"message": "User unbanned"}
