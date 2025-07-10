
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union

class DatabaseCredentials(BaseModel):
    host: str
    port: int
    user: str
    password: str
    dbname: str

class DatabaseResponse(BaseModel):
    id: int
    project_id: int
    user: str
    dbname: str
    host: str
    port: int
    # Note: We don't return password for security

    class Config:
        from_attributes = True

# Pydantic Models
class DatabaseConfig(BaseModel):
    host: str
    port: int = 5432
    user: str
    password: str
    database: Optional[str] = None

class Column(BaseModel):
    name: str
    type: str
    nullable: bool = True
    primary: bool = False
    auto_increment: bool = False

class CreateDatabaseRequest(DatabaseConfig):
    dbname: str

class CreateTableRequest(DatabaseConfig):
    database: str
    tablename: str
    columns: List[Column]

class InsertDataRequest(DatabaseConfig):
    database: str
    tablename: str
    data: Union[Dict[str, Any], List[Dict[str, Any]]]

class OrderBy(BaseModel):
    column: str
    direction: str = "ASC"

class FetchDataRequest(DatabaseConfig):
    database: str
    tablename: str
    where: Optional[Dict[str, Any]] = None
    order_by: Optional[OrderBy] = None
    limit: Optional[int] = None
    offset: int = 0

class UpdateDataRequest(DatabaseConfig):
    database: str
    tablename: str
    data: Dict[str, Any]
    where: Dict[str, Any]

class DeleteDataRequest(DatabaseConfig):
    database: str
    tablename: str
    where: Dict[str, Any]

class ListTablesRequest(DatabaseConfig):
    database: str

class TableSchemaRequest(DatabaseConfig):
    database: str
    tablename: str

class DropTableRequest(DatabaseConfig):
    database: str
    tablename: str