from fastapi import APIRouter,FastAPI, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
import asyncpg
import asyncio
from contextlib import asynccontextmanager
import logging
import json

from app.models.project import Proj_db_detail  # Adjust import path as needed

# Configure logging


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global connection pool storage
connection_pools = {}





# Pydantic models for request/response
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

# Helper Functions
async def get_connection_pool(config: DatabaseConfig):
    """Get or create connection pool for database"""
    database_name = getattr(config, 'database', None) or getattr(config, 'dbname', None) or 'postgres'
    key = f"{config.host}:{config.port}:{config.user}:{database_name}"
   
    if key not in connection_pools:
        try:
            pool = await asyncpg.create_pool(
                host=config.host,
                port=config.port,
                user=config.user,
                password=config.password,
                database=config.database or 'postgres',
                min_size=1,
                max_size=10
            )
            connection_pools[key] = pool
            logger.info(f"Created new connection pool for {key}")
        except Exception as e:
            logger.error(f"Failed to create connection pool: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to connect to database: {str(e)}")
    
    return connection_pools[key]

async def execute_query(pool, query: str, params: tuple = None, fetch: bool = True):
    """Execute query using connection pool"""
    async with pool.acquire() as conn:
        try:
            if fetch:
                if params:
                    result = await conn.fetch(query, *params)
                else:
                    result = await conn.fetch(query)
                # Convert asyncpg Records to dictionaries
                return [dict(record) for record in result]
            else:
                if params:
                    result = await conn.execute(query, *params)
                else:
                    result = await conn.execute(query)
                # Extract affected row count from result string
                if result.startswith('INSERT'):
                    return 1
                elif result.startswith('UPDATE') or result.startswith('DELETE'):
                    return int(result.split()[-1]) if result.split()[-1].isdigit() else 0
                return 0
        except Exception as e:
            logger.error(f"Query execution error: {str(e)}")
            raise

def create_success_response(message: str, data: Any = None):
    """Create standardized success response"""
    return {
        "success": True,
        "message": message,
        "data": data
    }

def create_error_response(message: str, error: str = None):
    """Create standardized error response"""
    response = {
        "success": False,
        "message": message
    }
    if error:
        response["error"] = error
    return response

def convert_mysql_to_postgres_type(mysql_type: str) -> str:
    """Convert MySQL types to PostgreSQL types"""
    type_mapping = {
        'INT': 'INTEGER',
        'BIGINT': 'BIGINT',
        'SMALLINT': 'SMALLINT',
        'TINYINT': 'SMALLINT',
        'VARCHAR': 'VARCHAR',
        'TEXT': 'TEXT',
        'LONGTEXT': 'TEXT',
        'DATETIME': 'TIMESTAMP',
        'TIMESTAMP': 'TIMESTAMP',
        'DATE': 'DATE',
        'TIME': 'TIME',
        'DECIMAL': 'DECIMAL',
        'FLOAT': 'REAL',
        'DOUBLE': 'DOUBLE PRECISION',
        'BOOLEAN': 'BOOLEAN',
        'BOOL': 'BOOLEAN',
        'JSON': 'JSONB'
    }
    
    # Handle types with parameters like VARCHAR(255)
    for mysql_t, postgres_t in type_mapping.items():
        if mysql_type.upper().startswith(mysql_t):
            return mysql_type.upper().replace(mysql_t, postgres_t)
    
    return mysql_type  # Return as-is if no mapping found

# FastAPI App
router = APIRouter(prefix="/Dynamic_db")

@router.on_event("shutdown")
async def shutdown_event():
    """Close all connection pools on shutdown"""
    for pool in connection_pools.values():
        await pool.close()

# API Endpoints

@router.post("/dbcreate")
async def create_database(request: CreateDatabaseRequest):
    """Create a new database"""
    try:
        # Connect to default postgres database
        config_without_db = DatabaseConfig(
            host=request.host,
            port=request.port,
            user=request.user,
            password=request.password,
            database='postgres'
        )
        
        pool = await get_connection_pool(config_without_db)
        
        # PostgreSQL requires different syntax for database creation
        async with pool.acquire() as conn:
            # Check if database exists
            exists = await conn.fetchval(
                "SELECT 1 FROM pg_database WHERE datname = $1", 
                request.dbname
            )
            
            if not exists:
                # Create database (cannot use parameters for database names)
                await conn.execute(f'CREATE DATABASE "{request.dbname}"')
        
        return create_success_response(
            f"Database '{request.dbname}' created successfully",
            {"dbname": request.dbname}
        )
        
    except Exception as e:
        logger.error(f"Error creating database: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=create_error_response("Failed to create database", str(e))
        )

@router.post("/tablecreate")
async def create_table(request: CreateTableRequest):
    """Create a new table with custom columns"""
    try:
        pool = await get_connection_pool(request)
        
        # Build column definitions for PostgreSQL
        column_defs = []
        primary_keys = []
        
        for col in request.columns:
            pg_type = convert_mysql_to_postgres_type(col.type)
            definition = f'"{col.name}" {pg_type}'
            
            if not col.nullable:
                definition += " NOT NULL"
            if col.auto_increment:
                if 'INT' in pg_type.upper():
                    definition = f'"{col.name}" SERIAL'
                    if not col.nullable:
                        definition += " NOT NULL"
            if col.primary:
                primary_keys.append(f'"{col.name}"')
            
            column_defs.append(definition)
        
        # Add primary key constraint
        if primary_keys:
            column_defs.append(f"PRIMARY KEY ({', '.join(primary_keys)})")
        
        columns_str = ", ".join(column_defs)
        query = f'CREATE TABLE IF NOT EXISTS "{request.tablename}" ({columns_str})'
        
        await execute_query(pool, query, fetch=False)
        
        return create_success_response(
            f"Table '{request.tablename}' created successfully",
            {"tablename": request.tablename, "columns": [col.dict() for col in request.columns]}
        )
        
    except Exception as e:
        logger.error(f"Error creating table: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response("Failed to create table", str(e))
        )

@router.post("/dbinsert")
async def insert_data(request: InsertDataRequest):
    """Insert data into table"""
    try:
        pool = await get_connection_pool(request)
        
        # Handle single record or multiple records
        records = request.data if isinstance(request.data, list) else [request.data]
        inserted_count = 0
        
        async with pool.acquire() as conn:
            for record in records:
                columns = list(record.keys())
                values = list(record.values())
                placeholders = ", ".join([f"${i+1}" for i in range(len(values))])
                column_names = ", ".join([f'"{col}"' for col in columns])
                
                query = f'INSERT INTO "{request.tablename}" ({column_names}) VALUES ({placeholders})'
                await conn.execute(query, *values)
                inserted_count += 1
        
        return create_success_response(
            f"{inserted_count} record(s) inserted successfully",
            {"inserted_count": inserted_count}
        )
        
    except Exception as e:
        logger.error(f"Error inserting data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response("Failed to insert data", str(e))
        )

@router.post("/dbfetch")
async def fetch_data(request: FetchDataRequest):
    """Fetch data from table with filtering, sorting, and pagination"""
    try:
        pool = await get_connection_pool(request)
        
        query = f'SELECT * FROM "{request.tablename}"'
        params = []
        param_counter = 1
        
        # Add WHERE clause
        if request.where:
            conditions = []
            for key, value in request.where.items():
                conditions.append(f'"{key}" = ${param_counter}')
                params.append(value)
                param_counter += 1
            query += f" WHERE {' AND '.join(conditions)}"
        
        # Add ORDER BY
        if request.order_by:
            query += f' ORDER BY "{request.order_by.column}" {request.order_by.direction}'
        
        # Add LIMIT and OFFSET
        if request.limit:
            query += f" LIMIT ${param_counter} OFFSET ${param_counter + 1}"
            params.extend([request.limit, request.offset])
        
        rows = await execute_query(pool, query, tuple(params) if params else None)
        
        return create_success_response(
            "Data fetched successfully",
            {"records": rows, "count": len(rows)}
        )
        
    except Exception as e:
        logger.error(f"Error fetching data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response("Failed to fetch data", str(e))
        )

@router.post("/dbupdate")
async def update_data(request: UpdateDataRequest):
    """Update data in table"""
    try:
        pool = await get_connection_pool(request)
        
        param_counter = 1
        set_columns = []
        params = []
        
        # Build SET clause
        for key, value in request.data.items():
            set_columns.append(f'"{key}" = ${param_counter}')
            params.append(value)
            param_counter += 1
        
        # Build WHERE clause
        where_columns = []
        for key, value in request.where.items():
            where_columns.append(f'"{key}" = ${param_counter}')
            params.append(value)
            param_counter += 1
        
        query = f'UPDATE "{request.tablename}" SET {", ".join(set_columns)} WHERE {" AND ".join(where_columns)}'
        
        affected_rows = await execute_query(pool, query, tuple(params), fetch=False)
        
        return create_success_response(
            f"{affected_rows} record(s) updated successfully",
            {"affected_rows": affected_rows}
        )
        
    except Exception as e:
        logger.error(f"Error updating data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response("Failed to update data", str(e))
        )

@router.post("/dbdelete")
async def delete_data(request: DeleteDataRequest):
    """Delete data from table"""
    try:
        pool = await get_connection_pool(request)
        
        param_counter = 1
        where_columns = []
        params = []
        
        for key, value in request.where.items():
            where_columns.append(f'"{key}" = ${param_counter}')
            params.append(value)
            param_counter += 1
        
        query = f'DELETE FROM "{request.tablename}" WHERE {" AND ".join(where_columns)}'
        
        affected_rows = await execute_query(pool, query, tuple(params), fetch=False)
        
        return create_success_response(
            f"{affected_rows} record(s) deleted successfully",
            {"affected_rows": affected_rows}
        )
        
    except Exception as e:
        logger.error(f"Error deleting data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response("Failed to delete data", str(e))
        )

@router.post("/dblist")
async def list_databases(request: DatabaseConfig):
    """List all databases"""
    try:
        config_with_postgres = DatabaseConfig(
            host=request.host,
            port=request.port,
            user=request.user,
            password=request.password,
            database='postgres'
        )
        
        pool = await get_connection_pool(config_with_postgres)
        rows = await execute_query(pool, 
            "SELECT datname FROM pg_database WHERE datistemplate = false")
        
        databases = [row['datname'] for row in rows]
        
        return create_success_response(
            "Databases listed successfully",
            {"databases": databases}
        )
        
    except Exception as e:
        logger.error(f"Error listing databases: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response("Failed to list databases", str(e))
        )

@router.post("/tablelist")
async def list_tables(request: ListTablesRequest):
    """List all tables in a database"""
    try:
        pool = await get_connection_pool(request)
        rows = await execute_query(pool, 
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
        
        tables = [row['tablename'] for row in rows]
        
        return create_success_response(
            "Tables listed successfully",
            {"tables": tables}
        )
        
    except Exception as e:
        logger.error(f"Error listing tables: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response("Failed to list tables", str(e))
        )

@router.post("/tableschema")
async def get_table_schema(request: TableSchemaRequest):
    """Get table schema/structure"""
    try:
        pool = await get_connection_pool(request)
        rows = await execute_query(pool, """
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = $1 AND table_schema = 'public'
            ORDER BY ordinal_position
        """, (request.tablename,))
        
        return create_success_response(
            "Table schema retrieved successfully",
            {"schema": rows}
        )
        
    except Exception as e:
        logger.error(f"Error getting table schema: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response("Failed to get table schema", str(e))
        )

@router.post("/tabledrop")
async def drop_table(request: DropTableRequest):
    """Drop a table"""
    try:
        pool = await get_connection_pool(request)
        await execute_query(pool, f'DROP TABLE IF EXISTS "{request.tablename}"', fetch=False)
        
        return create_success_response(
            f"Table '{request.tablename}' dropped successfully",
            {"tablename": request.tablename}
        )
        
    except Exception as e:
        logger.error(f"Error dropping table: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response("Failed to drop table", str(e))
        )

@router.post("/dbtest")
async def test_connection(request: DatabaseConfig):
    """Test database connection"""
    try:
        pool = await get_connection_pool(request)
        await execute_query(pool, "SELECT 1")
        
        return create_success_response(
            "Database connection successful",
            {
                "host": request.host,
                "port": request.port,
                "user": request.user,
                "database": request.database or "postgres"
            }
        )
        
    except Exception as e:
        logger.error(f"Error testing connection: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response("Database connection failed", str(e))
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)




# Add this new Pydantic model at the top with your other models
class AddProjectDatabaseRequest(BaseModel):
    host: str
    port: int = 5432
    user: str
    password: str
    dbname: str

# Replace the last two routes with these refactored versions
@router.post("/projects/{project_id}/databases")
async def add_project_database(project_id: int, request: AddProjectDatabaseRequest):
    """Add database credentials to project"""
    try:
        # Create connection to your dashboard database
        dashboard_config = DatabaseConfig(
            host="localhost",  # or get from environment variables
            port=5432,
            user="dashboard_user",
            password="Alinapauly@304",
            database="dashboard_db"
        )
        
        pool = await get_connection_pool(dashboard_config)
        
        # First, test the connection to the database being added
        test_config = DatabaseConfig(
            host=request.host,
            port=request.port,
            user=request.user,
            password=request.password,
            database=request.dbname
        )
        
        try:
            test_pool = await get_connection_pool(test_config)
            await execute_query(test_pool, "SELECT 1")  # Test connection
        except Exception as e:
            raise HTTPException(
                status_code=400, 
                detail=create_error_response("Invalid database credentials", str(e))
            )
        
        # Insert into proj_db_detail table
        insert_query = """
            INSERT INTO proj_db_detail (project_id, "user", password, dbname, host, port) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING id
        """
        
        result = await execute_query(
            pool, 
            insert_query, 
            (project_id, request.user, request.password, request.dbname, request.host, request.port)
        )
        
        return create_success_response(
            "Database credentials added successfully",
            {
                "id": result[0]["id"],
                "project_id": project_id,
                "user": request.user,
                "dbname": request.dbname,
                "host": request.host,
                "port": request.port
                # Note: Password is not returned for security
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding project database: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=create_error_response("Failed to add database credentials", str(e))
        )

@router.get("/projects/{project_id}/databases")
async def get_project_databases(project_id: int):
    """Get all databases for a project"""
    try:
        # Create connection to your dashboard database
        dashboard_config = DatabaseConfig(
            host="localhost",  # or get from environment variables
            port=5432,
            user="dashboard_user",
            password="Alinapauly@304",
            database="dashboard_db"
        )
        
        pool = await get_connection_pool(dashboard_config)
        
        # Query databases for the project
        query = """
            SELECT id, project_id, "user",password, dbname, host, port 
            FROM proj_db_detail 
            WHERE project_id = $1
        """
        
        databases = await execute_query(pool, query, (project_id,))
        
        return create_success_response(
            "Project databases retrieved successfully",
            {
                "project_id": project_id,
                "databases": databases,
                "count": len(databases)
            }
        )
        
    except Exception as e:
        logger.error(f"Error fetching project databases: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=create_error_response("Failed to fetch project databases", str(e))
        )

# Optional: Add a route to get database credentials for use in other operations
@router.post("/projects/databases/credentials")
async def get_database_credentials(request: BaseModel):
    """Get database credentials by database ID (for internal use)"""
    class GetCredentialsRequest(BaseModel):
        database_id: int
    
    try:
        dashboard_config = DatabaseConfig(
            host="localhost",
            port=5432,
            user="dashboard_user",
            password="Alinapauly@304",
            database="dashboard_db"
        )
        
        pool = await get_connection_pool(dashboard_config)
        
        query = """
            SELECT id, project_id, "user", password, dbname, host, port 
            FROM proj_db_detail 
            WHERE id = $1
        """
        
        result = await execute_query(pool, query, (request.database_id,))
        
        if not result:
            raise HTTPException(
                status_code=404,
                detail=create_error_response("Database credentials not found")
            )
        
        return create_success_response(
            "Database credentials retrieved successfully",
            result[0]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching database credentials: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response("Failed to fetch database credentials", str(e))
        )