from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from app.models.users import User
from app.database import SessionLocal
from app.utils.jwt import get_current_user
from app.schemas.user_schema import UserRead, UserUpdate

router = APIRouter(
    prefix="/user",
    tags=["User"]
)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
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
    # Fetch user with relationships loaded
    user = db.query(User).options(
        selectinload(User.role), 
        selectinload(User.organization)
    ).filter(User.id == current_user.id).first()
    
    if not user:
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
    
    return user_data


# Allow user to update their own profile
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
    user = db.query(User).options(
        selectinload(User.role), 
        selectinload(User.organization)
    ).filter(User.id == current_user.id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update only provided fields
    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(user, key, value)

    db.add(user)
    db.commit()
    db.refresh(user)
    
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