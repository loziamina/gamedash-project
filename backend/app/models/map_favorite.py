from sqlalchemy import Column, ForeignKey, Integer

from app.database import Base


class MapFavorite(Base):
    __tablename__ = "map_favorites"

    id = Column(Integer, primary_key=True)
    map_id = Column(Integer, ForeignKey("maps.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
