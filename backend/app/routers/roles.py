from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.models.users import User, Role
from app.models.permission import Permission, RolePermission
from app.database import SessionLocal
from app.utils.jwt import get_current_user
from app.schemas.role_schema import PermissionRead,RoleCreate,RoleRead,RoleUpdate
from datetime import datetime
from app.utils.logger import LoggerSetup
import os

router = APIRouter(prefix="/admin/roles", tags=["Role Management"])

logger = LoggerSetup.setup_logger('roles', os.path.join(os.getcwd(), 'logs'))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def is_admin(user: User, db: Session):
    """Check if user has admin privileges with detailed logging"""
    try:
        logger.info(f"Checking admin privileges for user: {user.username} (ID: {user.id}, Role ID: {user.role_id})")
        
        if user.role_id == 2:
            logger.info(f"User {user.username} has admin role (role_id 2)")
            return user
        
        user_role = db.query(Role).filter(Role.id == user.role_id).first()
        if user_role:
            logger.info(f"User {user.username} has role: {user_role.name}")
            if 'admin' in user_role.name.lower():
                logger.info(f"User {user.username} has admin role by name")
                return user
        else:
            logger.warning(f"Role ID {user.role_id} not found in database")
            
        has_admin_permission = db.query(Permission).join(
            RolePermission, Permission.id == RolePermission.permission_id
        ).filter(
            RolePermission.role_id == user.role_id,
            Permission.name == "system.admin"
        ).first()
        
        if has_admin_permission:
            logger.info(f"User {user.username} has system.admin permission")
            return user
            
        logger.warning(f"User {user.username} denied admin access")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail=f"Admin access required. User {user.username} does not have sufficient privileges."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin check failed for user {user.username}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error checking admin privileges"
        )


def is_system_role(role_id: int, db: Session) -> bool:
    """Check if a role is a system role (should have all permissions)"""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        return False
    # Assuming is_system=1 means system role, is_system=0 means regular user
    return bool(role.is_system)


@router.get("/permissions", response_model=List[PermissionRead])
def get_all_permissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all available permissions"""
    try:
        logger.info(f"User {current_user.username} requesting permissions list")
        
        # Check admin privileges
        is_admin(current_user, db)
        
        # Fetch permissions
        permissions = db.query(Permission).order_by(Permission.name).all()
        logger.info(f"Retrieved {len(permissions)} permissions for user {current_user.username}")
       
        result = []
        for perm in permissions:
            result.append({
                "id": perm.id,
                "name": perm.name,
                "description": perm.description or perm.name
            })
        
        logger.info(f"Returning {len(result)} permissions to frontend")
        return result
        
    except HTTPException as he:
        logger.error(f"HTTP error in get_all_permissions: {he.detail}")
        raise he
    except Exception as e:
        logger.error(f"Unexpected error in get_all_permissions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve permissions"
        )

@router.get("/", response_model=List[RoleRead])
def get_all_roles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all roles with their permissions - Enhanced with system role handling"""
    try:
        logger.info(f"User {current_user.username} requesting roles list")
        
        # Check admin privileges
        is_admin(current_user, db)
        
        # Get all roles
        roles = db.query(Role).order_by(Role.name).all()
        logger.info(f"Found {len(roles)} roles in database")
        
        # Get all permissions once for system roles
        all_permissions = db.query(Permission).order_by(Permission.name).all()
        
        result = []
        
        for role in roles:
            try:
                logger.info(f"Processing role: {role.name} (ID: {role.id})")
                
                system_role = is_system_role(role.id, db)
                
                if system_role:
                    # System role gets all permissions
                    logger.info(f"Role '{role.name}' is a system role - granting all permissions")
                    permissions_data = []
                    for perm in all_permissions:
                        permissions_data.append({
                            "id": perm.id,
                            "name": perm.name,
                            "description": perm.description or perm.name
                        })
                else:
                    # Regular role - get permissions from role_permissions table
                    role_permissions = db.query(Permission).join(
                        RolePermission, 
                        Permission.id == RolePermission.permission_id
                    ).filter(
                        RolePermission.role_id == role.id
                    ).order_by(Permission.name).all()
                    
                    logger.info(f"Role '{role.name}' has {len(role_permissions)} assigned permissions")
                    
                    permissions_data = []
                    for perm in role_permissions:
                        permissions_data.append({
                            "id": perm.id,
                            "name": perm.name,
                            "description": perm.description or perm.name
                        })
                
                role_data = {
                    "id": role.id,
                    "name": role.name,
                    "permissions": permissions_data,
                    "is_system": system_role
                }
                result.append(role_data)
                
            except Exception as role_error:
                logger.error(f"Error processing role {role.id} ({role.name}): {role_error}")
                # Still add the role but with empty permissions
                role_data = {
                    "id": role.id,
                    "name": role.name,
                    "permissions": [],
                    "is_system": False
                }
                result.append(role_data)
        
        logger.info(f"Successfully processed {len(result)} roles, returning to frontend")
        return result
        
    except HTTPException as he:
        logger.error(f"HTTP error in get_all_roles: {he.detail}")
        raise he
    except Exception as e:
        logger.error(f"Unexpected error in get_all_roles: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve roles"
        )

# Test endpoint for frontend debugging
@router.get("/test")
def test_endpoint(current_user: User = Depends(get_current_user)):
    """Test endpoint to verify authentication"""
    logger.info(f"Test endpoint accessed by user: {current_user.username}")
    return {
        "message": "Authentication successful",
        "user": {
            "username": current_user.username,
            "role_id": current_user.role_id,
            "id": current_user.id
        },
        "timestamp": str(datetime.utcnow())
    }

# Create a new role with enhanced error handling
@router.post("/", response_model=RoleRead)
def create_role(
    role_data: RoleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new role with permissions"""
    try:
        logger.info(f"User {current_user.username} creating new role: {role_data.name}")
        
        # Check admin privileges
        is_admin(current_user, db)
        
        # Check if role name already exists
        existing_role = db.query(Role).filter(Role.name == role_data.name).first()
        if existing_role:
            logger.warning(f"Role name '{role_data.name}' already exists")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role name already exists"
            )
        
        # Create the role
        new_role = Role(name=role_data.name)
        db.add(new_role)
        db.commit()
        db.refresh(new_role)
        
        logger.info(f"Created new role: {new_role.name} (ID: {new_role.id})")
        
        # Add permissions to the role (only if not a system role)
        added_permissions = []
        system_role = is_system_role(new_role.id, db)
        
        if not system_role:
            for permission_id in role_data.permission_ids:
                # Verify permission exists
                permission = db.query(Permission).filter(Permission.id == permission_id).first()
                if permission:
                    # Check if this role-permission combination already exists
                    existing_rp = db.query(RolePermission).filter(
                        RolePermission.role_id == new_role.id,
                        RolePermission.permission_id == permission_id
                    ).first()
                    
                    if not existing_rp:
                        role_permission = RolePermission(
                            role_id=new_role.id,
                            permission_id=permission_id
                        )
                        db.add(role_permission)
                        added_permissions.append(permission)
        else:
            # System role gets all permissions
            all_permissions = db.query(Permission).all()
            added_permissions = all_permissions
        
        db.commit()
        logger.info(f"Added {len(added_permissions)} permissions to role {new_role.name}")
        
        # Return role with permissions
        permissions_data = []
        for perm in added_permissions:
            permissions_data.append({
                "id": perm.id,
                "name": perm.name,
                "description": perm.description or perm.name
            })
        
        return {
            "id": new_role.id,
            "name": new_role.name,
            "permissions": permissions_data,
            "is_system": system_role
        }
        
    except HTTPException as he:
        logger.error(f"HTTP error in create_role: {he.detail}")
        db.rollback()
        raise he
    except Exception as e:
        logger.error(f"Unexpected error in create_role: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create role"
        )

# Update role permissions
@router.put("/{role_id}", response_model=RoleRead)
def update_role(
    role_id: int,
    role_data: RoleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a role and its permissions"""
    try:
        logger.info(f"User {current_user.username} updating role ID: {role_id}")
        
        # Check admin privileges
        is_admin(current_user, db)
        
        # Get the role
        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )
        
        # Check if it's a system role
        system_role = is_system_role(role_id, db)
        
        if system_role:
            logger.warning(f"Attempt to modify system role '{role.name}' - operation denied")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify system role permissions"
            )
        
        # Update role name if provided
        if role_data.name:
            # Check if new name already exists (excluding current role)
            existing_role = db.query(Role).filter(
                Role.name == role_data.name,
                Role.id != role_id
            ).first()
            if existing_role:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Role name already exists"
                )
            role.name = role_data.name
        
        # Update permissions if provided
        if role_data.permission_ids is not None:
            # Remove existing permissions
            db.query(RolePermission).filter(RolePermission.role_id == role_id).delete()
            
            # Add new permissions
            for permission_id in role_data.permission_ids:
                permission = db.query(Permission).filter(Permission.id == permission_id).first()
                if permission:
                    role_permission = RolePermission(
                        role_id=role_id,
                        permission_id=permission_id
                    )
                    db.add(role_permission)
        
        db.commit()
        db.refresh(role)
        
        # Get updated permissions
        role_permissions = db.query(Permission).join(
            RolePermission, 
            Permission.id == RolePermission.permission_id
        ).filter(
            RolePermission.role_id == role_id
        ).order_by(Permission.name).all()
        
        permissions_data = []
        for perm in role_permissions:
            permissions_data.append({
                "id": perm.id,
                "name": perm.name,
                "description": perm.description or perm.name
            })
        
        logger.info(f"Successfully updated role {role.name}")
        
        return {
            "id": role.id,
            "name": role.name,
            "permissions": permissions_data,
            "is_system": False
        }
        
    except HTTPException as he:
        logger.error(f"HTTP error in update_role: {he.detail}")
        db.rollback()
        raise he
    except Exception as e:
        logger.error(f"Unexpected error in update_role: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update role"
        )

# Delete role
@router.delete("/{role_id}")
def delete_role(
    role_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a role and its permissions"""
    try:
        logger.info(f"User {current_user.username} deleting role ID: {role_id}")
        
        # Check admin privileges  
        is_admin(current_user, db)
        
        # Get the role
        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )
        
        # Check if it's a system role
        system_role = is_system_role(role_id, db)
        if system_role:
            logger.warning(f"Attempt to delete system role '{role.name}' - operation denied")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete system role"
            )
        
        # Check if role is assigned to any users
        users_with_role = db.query(User).filter(User.role_id == role_id).count()
        if users_with_role > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete role. {users_with_role} users are assigned to this role."
            )
        
        # Delete role permissions first
        db.query(RolePermission).filter(RolePermission.role_id == role_id).delete()
        
        # Delete the role
        db.delete(role)
        db.commit()
        
        logger.info(f"Successfully deleted role: {role.name}")
        
        return {"message": f"Role '{role.name}' deleted successfully"}
        
    except HTTPException as he:
        logger.error(f"HTTP error in delete_role: {he.detail}")
        db.rollback()
        raise he
    except Exception as e:
        logger.error(f"Unexpected error in delete_role: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete role"
        )