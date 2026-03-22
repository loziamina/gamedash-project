from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str
    password: str
    pseudo: str

class UserLogin(BaseModel):
    email: str
    password: str