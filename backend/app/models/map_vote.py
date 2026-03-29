from sqlalchemy import Column, ForeignKey, Integer

from app.database import Base


class MapVote(Base):
    __tablename__ = "map_votes"

    id = Column(Integer, primary_key=True)
    map_id = Column(Integer, ForeignKey("maps.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    value = Column(Integer)
