from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from app.models.users import User
from app.database import SessionLocal
from app.utils.jwt import get_current_user
from app.schemas.user_schema import UserRead, UserUpdate
from app.utils.logger import LoggerSetup
import os

router = APIRouter(
    prefix="/user",
    tags=["User"]
)

logger = LoggerSetup.setup_logger('user', os.path.join(os.getcwd(), 'logs'))

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        logger.debug("Database session created")
        yield db
    finally:
        logger.debug("Database session closed")
        db.close()

# Get the current logged-in user's details
@router.get("/me", response_model=UserRead)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """_summary_

    Args:
        current_user (User, optional): _description_. Defaults to Depends(get_current_user).
        db (Session, optional): _description_. Defaults to Depends(get_db).

    Raises:
        HTTPException: _description_

    Returns:
        _type_: _description_
    """

    try:
        logger.info(f"User {current_user.id} requested their profile")
        
        # Fetch user with relationships loaded
        user = db.query(User).options(
            selectinload(User.role), 
            selectinload(User.organization)
        ).filter(User.id == current_user.id).first()
        
        if not user:
            logger.warning(f"Profile not found for user {current_user.id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create response with role and organization names
        user_data = UserRead(
            id=user.id,
            username=user.username,
            email=user.email,
            role_id=user.role_id,
            organization_id=user.organization_id,
            role_name=user.role.name if user.role else None,
            organization_name=user.organization.name if user.organization else None
        )
        
        logger.info(f"Successfully retrieved profile for user {current_user.id}")
        return user_data
    
    except Exception as e:
        logger.error(f"Error retrieving profile for user {current_user.id}: {str(e)}")
        raise


@router.put("/me", response_model=UserRead)
def update_my_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """_summary_

    Args:
        update_data (UserUpdate): _description_
        current_user (User, optional): _description_. Defaults to Depends(get_current_user).
        db (Session, optional): _description_. Defaults to Depends(get_db).

    Raises:
        HTTPException: _description_

    Returns:
        _type_: _description_
    """
    try:
        updated_fields = list(update_data.dict(exclude_unset=True).keys())
        logger.info(f"User {current_user.id} attempting to update profile, fields: {updated_fields}")
        
        user = db.query(User).options(
            selectinload(User.role), 
            selectinload(User.organization)
        ).filter(User.id == current_user.id).first()
        
        if not user:
            logger.warning(f"Profile not found for user {current_user.id} during update")
            raise HTTPException(status_code=404, detail="User not found")

        # Update only provided fields
        for key, value in update_data.dict(exclude_unset=True).items():
            setattr(user, key, value)

        db.add(user)
        db.commit()
        db.refresh(user)
        
        logger.info(f"User {current_user.id} successfully updated profile, fields: {updated_fields}")
        
        # Return updated user with relationship data
        updated_user_data = UserRead(
            id=user.id,
            username=user.username,
            email=user.email,
            role_id=user.role_id,
            organization_id=user.organization_id,
            role_name=user.role.name if user.role else None,
            organization_name=user.organization.name if user.organization else None
        )
        
        return updated_user_data
        
    except Exception as e:
        logger.error(f"Error updating profile for user {current_user.id}: {str(e)}")
        raise