from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.inventory_item import InventoryItem
from app.models.payment_transaction import PaymentTransaction
from app.models.shop_item import ShopItem
from app.models.store_pack import StorePack
from app.models.user import User
from app.models.virtual_transaction import VirtualTransaction
from app.utils.economy import (
    apply_reward,
    build_transaction_feed,
    create_payment_record,
    dump_claimed_tiers,
    ensure_store_seed_data,
    get_or_create_economy_settings,
    get_or_create_season_pass,
    get_season_pass_tiers,
    log_currency_transaction,
    parse_claimed_tiers,
    reward_inventory_item,
    serialize_economy_settings,
    serialize_inventory_entry,
    serialize_pack,
    serialize_shop_item,
)

router = APIRouter()


class SimulatedCheckoutPayload(BaseModel):
    provider: str


def get_user_inventory_map(db: Session, user_id: int):
    inventory = db.query(InventoryItem).filter(InventoryItem.user_id == user_id).all()
    return {entry.item_sku: entry for entry in inventory}


def get_shop_overview_payload(db: Session, user: User):
    ensure_store_seed_data(db)
    settings = get_or_create_economy_settings(db)
    season_pass = get_or_create_season_pass(db, user, settings)
    items = db.query(ShopItem).filter(ShopItem.is_active.is_(True)).order_by(ShopItem.is_featured.desc(), ShopItem.price_soft.asc()).all()
    packs = db.query(StorePack).filter(StorePack.is_active.is_(True)).order_by(StorePack.is_featured.desc(), StorePack.price_cents.asc()).all()
    inventory = (
        db.query(InventoryItem)
        .filter(InventoryItem.user_id == user.id)
        .order_by(InventoryItem.acquired_at.desc())
        .all()
    )
    inventory_map = {entry.item_sku: entry for entry in inventory}

    claimed_free = parse_claimed_tiers(season_pass.claimed_free_tiers)
    claimed_premium = parse_claimed_tiers(season_pass.claimed_premium_tiers)
    season_tiers = []
    highest_tier = 0
    for tier in get_season_pass_tiers(settings.season_tier_xp):
        unlocked = user.xp >= tier["xp_required"]
        if unlocked:
            highest_tier = tier["tier"]
        season_tiers.append(
            {
                **tier,
                "unlocked": unlocked,
                "free_claimed": tier["tier"] in claimed_free,
                "premium_claimed": tier["tier"] in claimed_premium,
            }
        )

    virtual_transactions = (
        db.query(VirtualTransaction)
        .filter(VirtualTransaction.user_id == user.id)
        .order_by(VirtualTransaction.created_at.desc())
        .limit(25)
        .all()
    )
    payment_transactions = (
        db.query(PaymentTransaction)
        .filter(PaymentTransaction.user_id == user.id)
        .order_by(PaymentTransaction.created_at.desc())
        .limit(25)
        .all()
    )

    return {
        "balances": {
            "soft_currency": user.soft_currency,
            "hard_currency": user.hard_currency,
        },
        "equipped": {
            "avatar_frame": user.equipped_avatar_frame,
            "title": user.equipped_title,
        },
        "economy_settings": serialize_economy_settings(settings),
        "catalog": [
            serialize_shop_item(
                item,
                owned=item.sku in inventory_map,
                equipped=inventory_map[item.sku].equipped if item.sku in inventory_map else False,
            )
            for item in items
        ],
        "packs": [serialize_pack(pack) for pack in packs],
        "inventory": [
            serialize_inventory_entry(entry, next((item for item in items if item.sku == entry.item_sku), None))
            for entry in inventory
        ],
        "season_pass": {
            "season_name": season_pass.season_name,
            "premium_unlocked": season_pass.premium_unlocked,
            "current_tier": highest_tier,
            "tiers": season_tiers,
        },
        "transactions": build_transaction_feed(virtual_transactions, payment_transactions),
    }


@router.get("/overview")
def get_shop_overview(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_shop_overview_payload(db, user)


@router.post("/items/{sku}/purchase")
def purchase_shop_item(sku: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_store_seed_data(db)
    item = db.query(ShopItem).filter(ShopItem.sku == sku, ShopItem.is_active.is_(True)).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    existing = (
        db.query(InventoryItem)
        .filter(InventoryItem.user_id == user.id, InventoryItem.item_sku == sku)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Item already owned")

    if item.price_hard > 0:
        if user.hard_currency < item.price_hard:
            raise HTTPException(status_code=400, detail="Not enough hard currency")
        user.hard_currency -= item.price_hard
        log_currency_transaction(db, user.id, -item.price_hard, "hard", f"shop_purchase:{sku}")
    else:
        if user.soft_currency < item.price_soft:
            raise HTTPException(status_code=400, detail="Not enough soft currency")
        user.soft_currency -= item.price_soft
        log_currency_transaction(db, user.id, -item.price_soft, "soft", f"shop_purchase:{sku}")

    reward_inventory_item(db, user, sku, "shop_purchase", sku)
    db.commit()
    db.refresh(user)
    return get_shop_overview_payload(db, user)


@router.post("/packs/{sku}/checkout")
def simulated_checkout(
    sku: str,
    payload: SimulatedCheckoutPayload,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_store_seed_data(db)
    settings = get_or_create_economy_settings(db)
    provider = payload.provider.lower()
    if provider not in {"stripe", "paypal"}:
        raise HTTPException(status_code=400, detail="Unsupported provider")
    if provider == "stripe" and not settings.stripe_enabled:
        raise HTTPException(status_code=400, detail="Stripe disabled")
    if provider == "paypal" and not settings.paypal_enabled:
        raise HTTPException(status_code=400, detail="PayPal disabled")

    pack = db.query(StorePack).filter(StorePack.sku == sku, StorePack.is_active.is_(True)).first()
    if not pack:
        raise HTTPException(status_code=404, detail="Pack not found")

    payment = create_payment_record(db, user.id, provider, pack)
    pack_payload = serialize_pack(pack)
    user.soft_currency += pack_payload["total_soft_currency"]
    user.hard_currency += pack_payload["total_hard_currency"]
    log_currency_transaction(db, user.id, pack_payload["total_soft_currency"], "soft", f"pack:{sku}:{provider}")
    log_currency_transaction(db, user.id, pack_payload["total_hard_currency"], "hard", f"pack:{sku}:{provider}")
    db.commit()
    db.refresh(payment)
    db.refresh(user)
    return get_shop_overview_payload(db, user)


@router.post("/season-pass/purchase")
def purchase_season_pass(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_store_seed_data(db)
    settings = get_or_create_economy_settings(db)
    season_pass = get_or_create_season_pass(db, user, settings)

    if season_pass.premium_unlocked:
        raise HTTPException(status_code=400, detail="Season pass already unlocked")
    if user.hard_currency < settings.premium_pass_price_hard:
        raise HTTPException(status_code=400, detail="Not enough hard currency")

    user.hard_currency -= settings.premium_pass_price_hard
    season_pass.premium_unlocked = True
    log_currency_transaction(db, user.id, -settings.premium_pass_price_hard, "hard", "season_pass_unlock")
    db.commit()
    db.refresh(user)
    return get_shop_overview_payload(db, user)


@router.post("/season-pass/claim/{tier}")
def claim_season_pass_tier(tier: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_store_seed_data(db)
    settings = get_or_create_economy_settings(db)
    season_pass = get_or_create_season_pass(db, user, settings)
    tier_payload = next((entry for entry in get_season_pass_tiers(settings.season_tier_xp) if entry["tier"] == tier), None)
    if not tier_payload:
        raise HTTPException(status_code=404, detail="Tier not found")
    if user.xp < tier_payload["xp_required"]:
        raise HTTPException(status_code=400, detail="Tier not unlocked yet")

    claimed_free = parse_claimed_tiers(season_pass.claimed_free_tiers)
    claimed_premium = parse_claimed_tiers(season_pass.claimed_premium_tiers)

    if tier not in claimed_free:
        apply_reward(db, user, tier_payload["free_reward"], f"season_free_tier_{tier}")
        claimed_free.add(tier)

    if season_pass.premium_unlocked and tier not in claimed_premium:
        apply_reward(db, user, tier_payload["premium_reward"], f"season_premium_tier_{tier}")
        claimed_premium.add(tier)

    season_pass.claimed_free_tiers = dump_claimed_tiers(claimed_free)
    season_pass.claimed_premium_tiers = dump_claimed_tiers(claimed_premium)
    db.commit()
    db.refresh(user)
    return get_shop_overview_payload(db, user)


@router.post("/inventory/{inventory_id}/equip")
def equip_inventory_item(inventory_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    inventory_entry = (
        db.query(InventoryItem)
        .filter(InventoryItem.id == inventory_id, InventoryItem.user_id == user.id)
        .first()
    )
    if not inventory_entry:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    same_type_entries = (
        db.query(InventoryItem)
        .filter(InventoryItem.user_id == user.id, InventoryItem.item_type == inventory_entry.item_type)
        .all()
    )
    for entry in same_type_entries:
        entry.equipped = entry.id == inventory_entry.id

    if inventory_entry.item_type == "avatar_frame":
        user.equipped_avatar_frame = inventory_entry.item_sku
    elif inventory_entry.item_type == "title":
        user.equipped_title = inventory_entry.item_sku

    db.commit()
    db.refresh(user)
    return get_shop_overview_payload(db, user)


@router.get("/transactions")
def get_shop_transactions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    virtual_transactions = (
        db.query(VirtualTransaction)
        .filter(VirtualTransaction.user_id == user.id)
        .order_by(VirtualTransaction.created_at.desc())
        .limit(50)
        .all()
    )
    payment_transactions = (
        db.query(PaymentTransaction)
        .filter(PaymentTransaction.user_id == user.id)
        .order_by(PaymentTransaction.created_at.desc())
        .limit(50)
        .all()
    )
    return {"transactions": build_transaction_feed(virtual_transactions, payment_transactions)}
