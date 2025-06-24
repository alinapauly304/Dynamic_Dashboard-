from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.models.users import User
from app.database import engine
from app.utils.jwt import get_current_user
from app.schemas.user_schema import UserCreate, UserRead, UserUpdate

router = APIRouter(prefix="/admin", tags=["Admin"])

# ✅ Inline admin check
def is_admin(user: User):
    """_summary_

    Args:
        user (User): _description_

    Raises:
        HTTPException: _description_

    Returns:
        _type_: _description_
    """
    if user.role_id != 2:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ✅ Get all users
@router.get("/users", response_model=list[UserRead])
def get_all_users(current_user: User = Depends(get_current_user)):
    """_summary_

    Args:
        current_user (User, optional): _description_. Defaults to Depends(get_current_user).

    Returns:
        _type_: _description_
    """
    is_admin(current_user)
    with Session(engine) as session:
        return session.exec(select(User)).all()

# ✅ Create a user
@router.post("/users", response_model=UserRead)
def create_user(user_data: UserCreate, current_user: User = Depends(get_current_user)):
    """_summary_

    Args:
        user_data (UserCreate): _description_
        current_user (User, optional): _description_. Defaults to Depends(get_current_user).

    Returns:
        _type_: _description_
    """
    is_admin(current_user)
    with Session(engine) as session:
        new_user = User(**user_data.dict())
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
        return new_user

# ✅ Update a user
@router.put("/users/{user_id}", response_model=UserRead)
def update_user(user_id: int, update_data: UserUpdate, current_user: User = Depends(get_current_user)):
    """_summary_

    Args:
        user_id (int): _description_
        update_data (UserUpdate): _description_
        current_user (User, optional): _description_. Defaults to Depends(get_current_user).

    Raises:
        HTTPException: _description_

    Returns:
        _type_: _description_
    """
    is_admin(current_user)
    with Session(engine) as session:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        for key, value in update_data.dict(exclude_unset=True).items():
            setattr(user, key, value)
        session.commit()
        session.refresh(user)
        return user

# ✅ Delete a user
@router.delete("/users/{user_id}")
def delete_user(user_id: int, current_user: User = Depends(get_current_user)):
    """_summary_

    Args:
        user_id (int): _description_
        current_user (User, optional): _description_. Defaults to Depends(get_current_user).

    Raises:
        HTTPException: _description_

    Returns:
        _type_: _description_
    """
    is_admin(current_user)
    with Session(engine) as session:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        session.delete(user)
        session.commit()
        return {"message": "User deleted successfully"}
