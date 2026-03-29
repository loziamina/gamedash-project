from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    pseudo: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


class UserProfileUpdate(BaseModel):
    pseudo: str
    avatar_url: str | None = None
    bio: str | None = None
    region: str | None = None
    language: str | None = None
    matchmaking_preferences: str | None = None
