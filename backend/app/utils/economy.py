from datetime import datetime
from uuid import uuid4

from app.models.economy_settings import EconomySettings
from app.models.inventory_item import InventoryItem
from app.models.payment_transaction import PaymentTransaction
from app.models.season_pass import SeasonPass
from app.models.shop_item import ShopItem
from app.models.store_pack import StorePack
from app.models.user import User
from app.models.virtual_transaction import VirtualTransaction


DEFAULT_SHOP_ITEMS = [
    {
        "sku": "frame-neon-red",
        "name": "Neon Red Frame",
        "description": "Contour premium pour votre avatar.",
        "category": "cosmetic",
        "item_type": "avatar_frame",
        "rarity": "epic",
        "price_soft": 180,
        "price_hard": 0,
        "asset": "ring-red",
        "is_featured": True,
    },
    {
        "sku": "frame-cyber-blue",
        "name": "Cyber Blue Frame",
        "description": "Cadre e-sport bleu electrique.",
        "category": "cosmetic",
        "item_type": "avatar_frame",
        "rarity": "rare",
        "price_soft": 130,
        "price_hard": 0,
        "asset": "ring-cyan",
        "is_featured": True,
    },
    {
        "sku": "title-arena-king",
        "name": "Titre Arena King",
        "description": "Affiche un titre legendaire sur votre profil.",
        "category": "cosmetic",
        "item_type": "title",
        "rarity": "legendary",
        "price_soft": 0,
        "price_hard": 12,
        "asset": "title-gold",
        "is_featured": True,
    },
    {
        "sku": "title-first-blood",
        "name": "Titre First Blood",
        "description": "Titre agressif pour les joueurs offensifs.",
        "category": "cosmetic",
        "item_type": "title",
        "rarity": "rare",
        "price_soft": 90,
        "price_hard": 0,
        "asset": "title-red",
        "is_featured": False,
    },
]

DEFAULT_STORE_PACKS = [
    {
        "sku": "starter-drop",
        "name": "Starter Drop",
        "description": "Petit pack pour debuter la boutique.",
        "soft_currency": 300,
        "hard_currency": 20,
        "bonus_percent": 0,
        "price_cents": 499,
        "is_featured": True,
    },
    {
        "sku": "competitor-bundle",
        "name": "Competitor Bundle",
        "description": "Recharge de saison pour joueurs reguliers.",
        "soft_currency": 750,
        "hard_currency": 55,
        "bonus_percent": 10,
        "price_cents": 1199,
        "is_featured": True,
    },
    {
        "sku": "creator-whale",
        "name": "Creator Whale",
        "description": "Pack XXL pour personnaliser tout le compte.",
        "soft_currency": 1800,
        "hard_currency": 150,
        "bonus_percent": 25,
        "price_cents": 2499,
        "is_featured": False,
    },
]


def get_or_create_economy_settings(db):
    settings = db.query(EconomySettings).first()
    if not settings:
        settings = EconomySettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def ensure_store_seed_data(db):
    get_or_create_economy_settings(db)

    if db.query(ShopItem).count() == 0:
        for payload in DEFAULT_SHOP_ITEMS:
            db.add(ShopItem(**payload))

    if db.query(StorePack).count() == 0:
        for payload in DEFAULT_STORE_PACKS:
            db.add(StorePack(**payload))

    db.commit()


def serialize_economy_settings(settings: EconomySettings):
    return {
        "starter_soft_currency": settings.starter_soft_currency,
        "starter_hard_currency": settings.starter_hard_currency,
        "season_name": settings.season_name,
        "season_ends_at": settings.season_ends_at,
        "season_tier_xp": settings.season_tier_xp,
        "premium_pass_price_hard": settings.premium_pass_price_hard,
        "stripe_enabled": settings.stripe_enabled,
        "paypal_enabled": settings.paypal_enabled,
    }


def serialize_shop_item(item: ShopItem, owned=False, equipped=False):
    return {
        "id": item.id,
        "sku": item.sku,
        "name": item.name,
        "description": item.description,
        "category": item.category,
        "item_type": item.item_type,
        "rarity": item.rarity,
        "price_soft": item.price_soft,
        "price_hard": item.price_hard,
        "asset": item.asset,
        "season_tier_required": item.season_tier_required,
        "is_featured": item.is_featured,
        "is_active": item.is_active,
        "owned": owned,
        "equipped": equipped,
    }


def serialize_pack(pack: StorePack):
    bonus_multiplier = 1 + (pack.bonus_percent / 100)
    return {
        "id": pack.id,
        "sku": pack.sku,
        "name": pack.name,
        "description": pack.description,
        "soft_currency": pack.soft_currency,
        "hard_currency": pack.hard_currency,
        "bonus_percent": pack.bonus_percent,
        "total_soft_currency": int(pack.soft_currency * bonus_multiplier),
        "total_hard_currency": int(pack.hard_currency * bonus_multiplier),
        "price_cents": pack.price_cents,
        "is_active": pack.is_active,
        "is_featured": pack.is_featured,
    }


def serialize_inventory_entry(entry: InventoryItem, item: ShopItem | None):
    return {
        "id": entry.id,
        "item_sku": entry.item_sku,
        "item_type": entry.item_type,
        "source_type": entry.source_type,
        "source_ref": entry.source_ref,
        "equipped": entry.equipped,
        "acquired_at": entry.acquired_at,
        "item": serialize_shop_item(item, owned=True, equipped=entry.equipped) if item else None,
    }


def log_currency_transaction(db, user_id: int, amount: int, currency_type: str, source: str):
    db.add(
        VirtualTransaction(
            user_id=user_id,
            amount=amount,
            currency_type=currency_type,
            source=source,
        )
    )


def get_or_create_season_pass(db, user: User, settings: EconomySettings):
    season_pass = db.query(SeasonPass).filter(SeasonPass.user_id == user.id).first()
    if not season_pass:
        season_pass = SeasonPass(user_id=user.id, season_name=settings.season_name)
        db.add(season_pass)
        db.commit()
        db.refresh(season_pass)
    elif season_pass.season_name != settings.season_name:
        season_pass.season_name = settings.season_name
        season_pass.premium_unlocked = False
        season_pass.claimed_free_tiers = ""
        season_pass.claimed_premium_tiers = ""
        db.commit()
        db.refresh(season_pass)
    return season_pass


def get_season_pass_tiers(tier_xp: int = 120):
    return [
        {"tier": 1, "xp_required": 0, "free_reward": {"type": "soft_currency", "amount": 60}, "premium_reward": {"type": "item", "sku": "frame-cyber-blue"}},
        {"tier": 2, "xp_required": tier_xp, "free_reward": {"type": "soft_currency", "amount": 90}, "premium_reward": {"type": "hard_currency", "amount": 5}},
        {"tier": 3, "xp_required": tier_xp * 2, "free_reward": {"type": "item", "sku": "title-first-blood"}, "premium_reward": {"type": "soft_currency", "amount": 140}},
        {"tier": 4, "xp_required": tier_xp * 3, "free_reward": {"type": "hard_currency", "amount": 4}, "premium_reward": {"type": "item", "sku": "frame-neon-red"}},
        {"tier": 5, "xp_required": tier_xp * 4, "free_reward": {"type": "soft_currency", "amount": 150}, "premium_reward": {"type": "item", "sku": "title-arena-king"}},
    ]


def parse_claimed_tiers(raw: str):
    if not raw:
        return set()
    return {int(value) for value in raw.split(",") if value}


def dump_claimed_tiers(values: set[int]):
    return ",".join(str(value) for value in sorted(values))


def reward_inventory_item(db, user: User, sku: str, source_type: str, source_ref: str):
    existing = (
        db.query(InventoryItem)
        .filter(InventoryItem.user_id == user.id, InventoryItem.item_sku == sku)
        .first()
    )
    if existing:
        return existing

    item = db.query(ShopItem).filter(ShopItem.sku == sku).first()
    inventory_entry = InventoryItem(
        user_id=user.id,
        item_sku=sku,
        item_type=item.item_type if item else "unknown",
        source_type=source_type,
        source_ref=source_ref,
    )
    db.add(inventory_entry)
    return inventory_entry


def apply_reward(db, user: User, reward: dict, source: str):
    reward_type = reward.get("type")
    if reward_type == "soft_currency":
        user.soft_currency += reward.get("amount", 0)
        log_currency_transaction(db, user.id, reward.get("amount", 0), "soft", source)
    elif reward_type == "hard_currency":
        user.hard_currency += reward.get("amount", 0)
        log_currency_transaction(db, user.id, reward.get("amount", 0), "hard", source)
    elif reward_type == "item":
        reward_inventory_item(db, user, reward.get("sku"), "season_pass", source)


def create_payment_record(db, user_id: int, provider: str, pack: StorePack):
    payment = PaymentTransaction(
        user_id=user_id,
        provider=provider,
        pack_sku=pack.sku,
        amount_cents=pack.price_cents,
        external_ref=f"SIM-{provider.upper()}-{uuid4().hex[:12]}",
    )
    db.add(payment)
    return payment


def build_transaction_feed(virtual_transactions, payment_transactions):
    feed = [
        {
            "id": f"virtual-{transaction.id}",
            "kind": "currency",
            "created_at": transaction.created_at,
            "currency_type": transaction.currency_type,
            "amount": transaction.amount,
            "source": transaction.source,
        }
        for transaction in virtual_transactions
    ]
    feed.extend(
        {
            "id": f"payment-{payment.id}",
            "kind": "payment",
            "created_at": payment.created_at,
            "provider": payment.provider,
            "pack_sku": payment.pack_sku,
            "amount_cents": payment.amount_cents,
            "status": payment.status,
            "external_ref": payment.external_ref,
        }
        for payment in payment_transactions
    )
    return sorted(feed, key=lambda entry: entry["created_at"] or datetime.min, reverse=True)
