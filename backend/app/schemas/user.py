from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    pseudo: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str