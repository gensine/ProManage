from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User
from app.schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    AuthSuccessResponse,
    UserResponse,
    GenericMessageResponse
)
from app.security import hash_password, verify_password, create_access_token
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=AuthSuccessResponse, status_code=status.HTTP_201_CREATED)
async def register(req: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if email already exists
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "DUPLICATE_EMAIL", "message": "User with this email already exists"}
        )

    hashed = hash_password(req.password)
    new_user = User(
        full_name=req.fullName,
        email=req.email,
        password_hash=hashed
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token(data={"sub": new_user.id, "email": new_user.email})
    return AuthSuccessResponse(
        user=UserResponse.model_validate(new_user),
        token=token
    )

@router.post("/login", response_model=AuthSuccessResponse)
async def login(req: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "Invalid email or password"}
        )

    token = create_access_token(data={"sub": user.id, "email": user.email})
    return AuthSuccessResponse(
        user=UserResponse.model_validate(user),
        token=token
    )

@router.post("/logout", response_model=GenericMessageResponse)
async def logout(current_user: User = Depends(get_current_user)):
    return GenericMessageResponse(message="Logged out successfully")

@router.get("/me", response_model=dict)
async def get_me(current_user: User = Depends(get_current_user)):
    return {"user": UserResponse.model_validate(current_user)}
