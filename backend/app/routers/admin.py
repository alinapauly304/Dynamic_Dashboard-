from fastapi import APIRouter, Depends, HTTPException, Path
from sqlmodel import Session, select
from app.models.users import User, Role

from app.database import engine
from app.utils.jwt import get_current_user
from app.schemas.user_schema import UserCreate, UserRead, UserUpdate

router = APIRouter()

def is_admin(user: User):
    if user.role_id != 2:
        raise HTTPException(status_code=403, detail="Not authorized")
    return user

# Get all users
@router.get("/users", response_model=list[UserRead])
def get_all_users(current_user: User = Depends(get_current_user)):
    is_admin(current_user)
    with Session(engine) as session:
        return session.exec(select(User)).all()

# Create user
@router.post("/users", response_model=UserRead)
def create_user(user_data: UserCreate, current_user: User = Depends(get_current_user)):
    is_admin(current_user)
    with Session(engine) as session:
        user = User(**user_data.dict())
        session.add(user)
        session.commit()
        session.refresh(user)
        return user

# Update user
@router.put("/users/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user)
):
    is_admin(current_user)
    with Session(engine) as session:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        for key, value in update_data.dict(exclude_unset=True).items():
            setattr(user, key, value)
        session.add(user)
        session.commit()
        session.refresh(user)
        return user

# Delete user
@router.delete("/users/{user_id}")
def delete_user(user_id: int, current_user: User = Depends(get_current_user)):
    is_admin(current_user)
    with Session(engine) as session:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        session.delete(user)
        session.commit()
        return {"message": "User deleted"}
