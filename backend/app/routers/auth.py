from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api")


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    email: str


@router.post("/login")
def login(body: LoginRequest) -> LoginResponse:
    """Fake sign in: accepts any credentials until real authentication exists."""
    return LoginResponse(email=body.email)
