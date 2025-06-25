from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.models.users import Organization, User
from app.schemas.organization_schema import OrganizationCreate, OrganizationUpdate, OrganizationResponse, OrganizationWithUsers
from app.utils.jwt import get_current_user, get_db
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/organizations")

@router.get("/", response_model=List[OrganizationResponse])
def get_all_organizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all organizations - Admin only"""
    if current_user.role_id != 2:  # Admin role
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    organizations = db.query(Organization).all()
    
    # Add member and project counts
    result = []
    for org in organizations:
        member_count = db.query(User).filter(User.organization_id == org.id).count()
        # You can add project count when you have projects table ready
        org_dict = {
            "id": org.id,
            "name": org.name,
            "description": getattr(org, 'description', ''),
            "website": getattr(org, 'website', ''),
            "industry": getattr(org, 'industry', ''),
            "size": getattr(org, 'size', ''),
            "members": member_count,
            "projects": 0,  # Will be updated when projects are implemented
            "status": getattr(org, 'status', 'active'),
            "created_at": org.created_at
        }
        result.append(org_dict)
    
    return result

@router.get("/{org_id}", response_model=OrganizationWithUsers)
def get_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get organization by ID with users"""
    # Admin can see all, users can only see their own organization
    if current_user.role_id != 2 and current_user.organization_id != org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    organization = db.query(Organization).filter(Organization.id == org_id).first()
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Get users belonging to this organization
    users = db.query(User).filter(User.organization_id == org_id).all()
    
    return {
        "id": organization.id,
        "name": organization.name,
        "description": getattr(organization, 'description', ''),
        "website": getattr(organization, 'website', ''),
        "industry": getattr(organization, 'industry', ''),
        "size": getattr(organization, 'size', ''),
        "status": getattr(organization, 'status', 'active'),
        "created_at": organization.created_at,
        "users": [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role_id": user.role_id,
                "is_active": user.is_active,
                "created_at": user.created_at
            } for user in users
        ]
    }

@router.post("/", response_model=OrganizationResponse)
def create_organization(
    organization: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new organization - Admin only"""
    if current_user.role_id != 2:  # Admin role
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if organization name already exists
    existing_org = db.query(Organization).filter(Organization.name == organization.name).first()
    if existing_org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization with this name already exists"
        )
    
    db_organization = Organization(
        name=organization.name,
        description=organization.description,
        website=organization.website,
        industry=organization.industry,
        size=organization.size,
        status="active",
        created_at=datetime.utcnow()
    )
    
    db.add(db_organization)
    db.commit()
    db.refresh(db_organization)
    
    # Get member count (should be 0 for new org)
    member_count = db.query(User).filter(User.organization_id == db_organization.id).count()
    
    return {
        "id": db_organization.id,
        "name": db_organization.name,
        "description": db_organization.description,
        "website": db_organization.website,
        "industry": db_organization.industry,
        "size": db_organization.size,
        "members": member_count,
        "projects": 0,
        "status": db_organization.status,
        "created_at": db_organization.created_at
    }

@router.put("/{org_id}", response_model=OrganizationResponse)
def update_organization(
    org_id: int,
    organization: OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update organization - Admin only"""
    if current_user.role_id != 2:  # Admin role
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db_organization = db.query(Organization).filter(Organization.id == org_id).first()
    if not db_organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Check if new name conflicts with existing organization
    if organization.name and organization.name != db_organization.name:
        existing_org = db.query(Organization).filter(Organization.name == organization.name).first()
        if existing_org:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization with this name already exists"
            )
    
    # Update fields if provided
    update_data = organization.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_organization, field, value)
    
    db.commit()
    db.refresh(db_organization)
    
    # Get member count
    member_count = db.query(User).filter(User.organization_id == db_organization.id).count()
    
    return {
        "id": db_organization.id,
        "name": db_organization.name,
        "description": db_organization.description,
        "website": db_organization.website,
        "industry": db_organization.industry,
        "size": db_organization.size,
        "members": member_count,
        "projects": 0,
        "status": db_organization.status,
        "created_at": db_organization.created_at
    }

@router.delete("/{org_id}")
def delete_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete organization - Admin only"""
    if current_user.role_id != 2:  # Admin role
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db_organization = db.query(Organization).filter(Organization.id == org_id).first()
    if not db_organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Check if organization has users
    users_count = db.query(User).filter(User.organization_id == org_id).count()
    if users_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete organization with {users_count} users. Please reassign users first."
        )
    
    db.delete(db_organization)
    db.commit()
    
    return {"message": "Organization deleted successfully"}

@router.get("/{org_id}/users", response_model=List[dict])
def get_organization_users(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all users in an organization"""
    # Admin can see all, users can only see their own organization
    if current_user.role_id != 2 and current_user.organization_id != org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Verify organization exists
    organization = db.query(Organization).filter(Organization.id == org_id).first()
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    users = db.query(User).filter(User.organization_id == org_id).all()
    
    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role_id": user.role_id,
            "is_active": user.is_active,
            "created_at": user.created_at
        } for user in users
    ]