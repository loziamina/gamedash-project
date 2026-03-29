from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_optional_current_user
from app.database import get_db
from app.models.map import Map
from app.models.map_comment import MapComment
from app.models.map_favorite import MapFavorite
from app.models.map_tag import MapTag
from app.models.map_version import MapVersion
from app.models.map_vote import MapVote
from app.models.user import User

router = APIRouter(prefix="/maps")


class CreateMapPayload(BaseModel):
    title: str
    description: str
    status: str = "draft"
    tags: list[str] = Field(default_factory=list)


class AddVersionPayload(BaseModel):
    map_id: int
    notes: str


class VoteMapPayload(BaseModel):
    map_id: int
    value: int


class FavoriteMapPayload(BaseModel):
    map_id: int


class CommentMapPayload(BaseModel):
    map_id: int
    content: str


def _serialize_map(game_map: Map, db: Session, current_user: User | None):
    votes = db.query(MapVote).filter(MapVote.map_id == game_map.id).all()
    versions = (
        db.query(MapVersion)
        .filter(MapVersion.map_id == game_map.id)
        .order_by(MapVersion.created_at.desc())
        .all()
    )
    tags = db.query(MapTag).filter(MapTag.map_id == game_map.id).all()
    comments = (
        db.query(MapComment)
        .filter(MapComment.map_id == game_map.id)
        .order_by(MapComment.created_at.desc())
        .all()
    )
    favorites = db.query(MapFavorite).filter(MapFavorite.map_id == game_map.id).all()
    author = db.query(User).filter(User.id == game_map.author_id).first()

    like_count = sum(1 for vote in votes if vote.value == 1)
    dislike_count = sum(1 for vote in votes if vote.value == -1)
    score = like_count - dislike_count
    popularity = score * 2 + len(favorites) * 3 + len(comments) + len(versions)

    recent_bonus = 0
    if game_map.created_at and game_map.created_at >= datetime.utcnow() - timedelta(days=7):
        recent_bonus = 5

    user_vote = None
    is_favorited = False
    if current_user:
        current_vote = next((vote for vote in votes if vote.user_id == current_user.id), None)
        user_vote = current_vote.value if current_vote else None
        is_favorited = any(favorite.user_id == current_user.id for favorite in favorites)

    return {
        "id": game_map.id,
        "title": game_map.title,
        "description": game_map.description,
        "status": game_map.status,
        "author": {
            "id": author.id if author else game_map.author_id,
            "pseudo": author.pseudo if author else f"Player {game_map.author_id}",
        },
        "score": score,
        "likes": like_count,
        "dislikes": dislike_count,
        "favorites": len(favorites),
        "comments_count": len(comments),
        "versions_count": len(versions),
        "popularity": popularity + recent_bonus,
        "is_favorited": is_favorited,
        "user_vote": user_vote,
        "tags": [tag.name for tag in tags],
        "created_at": game_map.created_at,
        "versions": [
            {
                "id": version.id,
                "version": version.version,
                "notes": version.notes,
                "created_at": version.created_at,
            }
            for version in versions
        ],
        "comments": [
            {
                "id": comment.id,
                "author_id": comment.user_id,
                "content": comment.content,
                "created_at": comment.created_at,
            }
            for comment in comments
        ],
    }


@router.post("/")
def create_map(
    payload: CreateMapPayload,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    game_map = Map(
        title=payload.title,
        description=payload.description,
        author_id=user.id,
        status=payload.status,
    )

    db.add(game_map)
    db.commit()
    db.refresh(game_map)

    db.add(
        MapVersion(
            map_id=game_map.id,
            version="v1",
            notes="Initial release",
        )
    )

    for tag_name in payload.tags[:5]:
        cleaned = tag_name.strip().lower()
        if cleaned:
            db.add(MapTag(map_id=game_map.id, name=cleaned))

    db.commit()
    return {"message": "Map created", "map_id": game_map.id}


@router.post("/version")
def add_version(
    payload: AddVersionPayload,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    game_map = db.query(Map).filter(Map.id == payload.map_id).first()

    if not game_map:
        raise HTTPException(status_code=404, detail="Map not found")

    if game_map.author_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed to edit this map")

    count = db.query(MapVersion).filter(MapVersion.map_id == payload.map_id).count()
    version = f"v{count + 1}"

    db.add(
        MapVersion(
            map_id=payload.map_id,
            version=version,
            notes=payload.notes,
        )
    )
    db.commit()

    return {"message": "Version added", "version": version}


@router.post("/vote")
def vote(
    payload: VoteMapPayload,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.value not in (-1, 1):
        raise HTTPException(status_code=400, detail="Vote must be 1 or -1")

    existing_vote = db.query(MapVote).filter(
        MapVote.map_id == payload.map_id,
        MapVote.user_id == user.id,
    ).first()

    if existing_vote:
        existing_vote.value = payload.value
    else:
        db.add(MapVote(map_id=payload.map_id, user_id=user.id, value=payload.value))

    db.commit()
    return {"message": "Vote added"}


@router.post("/favorite")
def favorite_map(
    payload: FavoriteMapPayload,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    favorite = db.query(MapFavorite).filter(
        MapFavorite.map_id == payload.map_id,
        MapFavorite.user_id == user.id,
    ).first()

    if favorite:
        db.delete(favorite)
        db.commit()
        return {"message": "Favorite removed", "is_favorited": False}

    db.add(MapFavorite(map_id=payload.map_id, user_id=user.id))
    db.commit()
    return {"message": "Favorite added", "is_favorited": True}


@router.post("/comment")
def comment_map(
    payload: CommentMapPayload,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Comment cannot be empty")

    db.add(MapComment(map_id=payload.map_id, user_id=user.id, content=content))
    db.commit()
    return {"message": "Comment added"}


@router.get("/")
def get_maps(
    q: str | None = Query(default=None),
    status: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    sort: str = Query(default="trending"),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    maps = db.query(Map).all()
    items = [_serialize_map(game_map, db, current_user) for game_map in maps]

    if q:
        term = q.lower()
        items = [
            item
            for item in items
            if term in item["title"].lower()
            or term in item["description"].lower()
            or any(term in map_tag for map_tag in item["tags"])
        ]

    if status:
        items = [item for item in items if item["status"] == status]

    if tag:
        tag_lower = tag.lower()
        items = [item for item in items if tag_lower in item["tags"]]

    if sort == "newest":
        items.sort(key=lambda item: item["created_at"] or datetime.min, reverse=True)
    elif sort == "top":
        items.sort(key=lambda item: item["score"], reverse=True)
    elif sort == "favorites":
        items.sort(key=lambda item: item["favorites"], reverse=True)
    else:
        items.sort(key=lambda item: item["popularity"], reverse=True)

    return items
