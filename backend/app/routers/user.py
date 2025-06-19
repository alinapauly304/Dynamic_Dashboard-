from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.models.users import User
from app.database import engine
from app.utils.jwt import get_current_user
from app.schemas.user_schema import UserRead, UserUpdate

router = APIRouter(
    prefix="/user",
    tags=["User"]
)

# Get the current logged-in user's details
@router.get("/me", response_model=UserRead)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


# Allow user to update their own profile
@router.put("/me", response_model=UserRead)
def update_my_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user)
):
    with Session(engine) as session:
        user = session.get(User, current_user.id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        for key, value in update_data.dict(exclude_unset=True).items():
            setattr(user, key, value)

        session.add(user)
        session.commit()
        session.refresh(user)
        return user
