from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.models.users import User
from app.database import engine
from app.utils.jwt import get_current_user
from app.schemas.user_schema import UserCreate, UserRead, UserUpdate
from app.utils.logger import LoggerSetup
import os

router = APIRouter(prefix="/admin", tags=["Admin"])
logger = LoggerSetup.setup_logger('admin', os.path.join(os.getcwd(), 'logs'))

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
        logger.warning(f"Unauthorized admin access attempt by user {user.id}")
        raise HTTPException(status_code=403, detail="Admin access required")
    logger.info(f"Admin access granted to user {user.id}")
    return user

@router.get("/users", response_model=list[UserRead])
def get_all_users(current_user: User = Depends(get_current_user)):
    """_summary_

    Args:
        current_user (User, optional): _description_. Defaults to Depends(get_current_user).

    Returns:
        _type_: _description_
    """
    try:
        is_admin(current_user)
        with Session(engine) as session:
            users = session.exec(select(User)).all()
            logger.info(f"Retrieved {len(users)} users for admin {current_user.id}")
            return users
    except Exception as e:
        logger.error(f"Error retrieving users for admin {current_user.id}: {str(e)}")
        raise

@router.post("/users", response_model=UserRead)
def create_user(user_data: UserCreate, current_user: User = Depends(get_current_user)):
    """_summary_

    Args:
        user_data (UserCreate): _description_
        current_user (User, optional): _description_. Defaults to Depends(get_current_user).

    Returns:
        _type_: _description_
    """
    try:
        logger.info(f"Admin {current_user.id} attempting to create new user")
        is_admin(current_user)
        with Session(engine) as session:
            new_user = User(**user_data.dict())
            session.add(new_user)
            session.commit()
            session.refresh(new_user)
            logger.info(f"Admin {current_user.id} successfully created user {new_user.id}")
            return new_user
    except Exception as e:
        logger.error(f"Error creating user by admin {current_user.id}: {str(e)}")
        raise
    

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
    try:
        logger.info(f"Admin {current_user.id} attempting to update user {user_id}")
        is_admin(current_user)
        with Session(engine) as session:
            user = session.get(User, user_id)
            if not user:
                logger.warning(f"Admin {current_user.id} tried to update non-existent user {user_id}")
                raise HTTPException(status_code=404, detail="User not found")
            updated_fields = list(update_data.dict(exclude_unset=True).keys())
            for key, value in update_data.dict(exclude_unset=True).items():
                setattr(user, key, value)
            session.commit()
            session.refresh(user)
            logger.info(f"Admin {current_user.id} successfully updated user {user_id}, fields: {updated_fields}")
            return user
    except Exception as e:
        logger.error(f"Error updating user {user_id} by admin {current_user.id}: {str(e)}")
        raise

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
    try:
        logger.info(f"Admin {current_user.id} attempting to delete user {user_id}")
        is_admin(current_user)
        with Session(engine) as session:
            user = session.get(User, user_id)
            if not user:
                logger.warning(f"Admin {current_user.id} tried to delete non-existent user {user_id}")
                raise HTTPException(status_code=404, detail="User not found")
            session.delete(user)
            session.commit()
            logger.info(f"Admin {current_user.id} successfully deleted user {user_id}")
            return {"message": "User deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting user {user_id} by admin {current_user.id}: {str(e)}")
        raise