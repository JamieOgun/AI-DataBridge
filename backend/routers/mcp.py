from fastmcp import FastMCP
from fastmcp.server.dependencies import get_http_request
from database import DatabaseConnection
from openai import OpenAI
from data import load_mcp_instances
from dotenv import load_dotenv
import os

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize OpenAI client with API key
if OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
else:
    print("Warning: OPENAI_API_KEY not found in environment variables")
    openai_client = None

mcp = FastMCP("My Server")

DB = DatabaseConnection()
DB.connect() 

@mcp.tool
def generate_sql_query(query: str) -> dict:
    """Generate a SQL query based on the user's request and allowed tables"""
    request = get_http_request()
    instance_id = request.query_params.get("instance_id")

    if not instance_id:
        return "Error: No instance_id found in request"
    
    mcp_instances = load_mcp_instances()
    mcp_instance = next((mcp for mcp in mcp_instances if mcp["id"] == instance_id), None)
    
    if not mcp_instance:
        return "Error: Invalid instance ID"
    
    allowed_tables = mcp_instance.get("allowedTables", [])
    
    if DB.connection is None:
        DB.connect()
    
    # Build schema context filtered by allowed tables
    database_context = DB.build_schema_context(schemas=allowed_tables)
    
    if not openai_client:
        return {"error": "OpenAI API key not configured"}
    
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",  # Using a valid OpenAI model
        messages=[
            {"role": "system", "content": "You are a helpful assistant that generates SQL queries based on the user's request."},
            {"role": "user", "content": f"User request: {query}\n\nDatabase context: {database_context}"}
        ]
    )

    sql_query = response.choices[0].message.content
    
    return {"sql_query": sql_query}

@mcp.tool
def get_database_context() -> str:
    """Get the database context filtered by instance allowed tables"""
    try:
        request = get_http_request()
        
        # Get instance_id from query parameter (primary method, matching reference pattern)
        instance_id = request.query_params.get("instance_id")
        
        if not instance_id:
            return "Error: No instance_id found in request"
        
        # Strip whitespace and normalize the instance_id
        instance_id = instance_id.strip()
        
        # Load MCP instances from JSON file
        mcp_instances = load_mcp_instances()
        
        # Look up MCP instance by id (case-sensitive string match)
        mcp_instance = next((mcp for mcp in mcp_instances if str(mcp["id"]) == instance_id), None)
        
        if not mcp_instance:
            # Provide helpful error message with available IDs
            available_ids = [str(mcp["id"]) for mcp in mcp_instances]
            return f"Error: Invalid instance ID '{instance_id}'. Available IDs: {', '.join(available_ids)}"
        
        # Get allowed tables for this instance
        allowed_tables = mcp_instance.get("allowedTables", [])
        
        if DB.connection is None:
            DB.connect()
        
        # Build schema context filtered by allowed tables
        return DB.build_schema_context(schemas=allowed_tables)
    except Exception as exc:
        return f"Error: {exc}"

@mcp.tool
def execute_query(query: str) -> dict:
    """Execute a query on the database"""
    try:
        if DB.connection is None:
            DB.connect()
        result = DB.execute_query(query)
        data = result.to_dict('records') if not result.empty else []
        return {"data": data}
    except Exception as exc:
        return {"error": str(exc)}

mcp_app = mcp.http_app() 

if __name__ == "__main__":
    mcp.run()