# In app/utils/permissions.py
from sqlalchemy.orm import Session
from app.models.users import User, Role
from app.models.permission import Permission, RolePermission

def user_has_permission(user: User, permission_name: str, db: Session) -> bool:
    """Check if user has a specific permission"""
    if not user.role_id:
        return False
    
    # Check if it's a system role (has all permissions)
    role = db.query(Role).filter(Role.id == user.role_id).first()
    if role and role.is_system:
        return True
    
    # Check specific permission
    has_permission = db.query(Permission).join(
        RolePermission, Permission.id == RolePermission.permission_id
    ).filter(
        RolePermission.role_id == user.role_id,
        Permission.name == permission_name
    ).first()
    
    return bool(has_permission)

def get_user_permissions(user: User, db: Session) -> list:
    """Get all permissions for a user"""
    if not user.role_id:
        return []
    
    # Check if it's a system role
    role = db.query(Role).filter(Role.id == user.role_id).first()
    if role and role.is_system:
        # Return all permissions
        all_permissions = db.query(Permission).all()
        return [perm.name for perm in all_permissions]
    
    # Get specific permissions
    permissions = db.query(Permission).join(
        RolePermission, Permission.id == RolePermission.permission_id
    ).filter(RolePermission.role_id == user.role_id).all()
    
    return [perm.name for perm in permissions]
