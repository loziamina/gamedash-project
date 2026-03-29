from sqlalchemy import Column, ForeignKey, Integer, String

from app.database import Base


class MapTag(Base):
    __tablename__ = "map_tags"

    id = Column(Integer, primary_key=True)
    map_id = Column(Integer, ForeignKey("maps.id"))
    name = Column(String)
