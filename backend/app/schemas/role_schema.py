from pydantic import BaseModel
from typing import List, Optional

class PermissionRead(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True
        orm_mode = True

class RoleRead(BaseModel):
    id: int
    name: str
    permissions: List[PermissionRead] = []
    is_system: bool = False  

    class Config:
        from_attributes = True
        orm_mode = True

class RoleCreate(BaseModel):
    name: str
    permission_ids: List[int] = []

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    permission_ids: Optional[List[int]] = None
