"""
Database Connection Script for WideWorldImporters
Connects to SQL Server and retrieves data programmatically
"""

import pymssql
import pandas as pd
import os
class DatabaseConnection:
    def __init__(self):
        """Initialize database connection parameters"""
        self.server = 'pepsaco-db-standard.c1oqimeoszvd.eu-west-2.rds.amazonaws.com'
        self.port = 1433  # pymssql expects int, not string
        self.database = 'WideWorldImporters_Base'
        self.username = 'hackathon_ro_01'
        self.password = 'F2p!rA8#'
        self.connection = None
    
    def connect(self):
        """Connect to the database"""
        try:
            self.connection = pymssql.connect(
                server=self.server,
                port=self.port,
                database=self.database,
                user=self.username,
                password=self.password
            )
            print("Connected to the database")
            return self.connection
        except Exception as e:
            print(f"Error connecting to the database: {e}")
            raise

    def execute_query(self, query: str) -> pd.DataFrame:
        """Execute a query and return the result as a pandas dataframe"""
        cursor = None
        try:
            cursor = self.connection.cursor(as_dict=False)
            cursor.execute(query)
            
            # Get column names from cursor description
            columns = [column[0] for column in cursor.description] if cursor.description else []
            
            # Fetch all rows
            rows = cursor.fetchall()
            
            if rows and columns:
                return pd.DataFrame(rows, columns=columns)
            else:
                return pd.DataFrame(columns=columns)
        except Exception as e:
            print(f"Error executing query: {e}")
            import traceback
            traceback.print_exc()
            return pd.DataFrame() 
        finally:
            if cursor:
                cursor.close()
        
    def get_table_data(self, schema: str, table: str, limit: int = 100) -> pd.DataFrame:
        """Get data from a specific table"""
        try:
            col_query = f"""
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = '{schema}' AND TABLE_NAME = '{table}'
            ORDER BY ORDINAL_POSITION
            """
            col_info = self.execute_query(col_query)
            
            if col_info.empty:
                print(f"Warning: Could not get column info for {schema}.{table}")
                query = f"SELECT TOP {limit} * FROM {schema}.{table}"
                return self.execute_query(query)
            
            safe_cols = []
            for _, row in col_info.iterrows():
                col_name = row['COLUMN_NAME']
                data_type = str(row['DATA_TYPE']).lower()
                if data_type in ['geography', 'geometry', 'hierarchyid', 'sql_variant']:
                    safe_cols.append(f"CONVERT(NVARCHAR(MAX), [{col_name}]) AS [{col_name}]")
                else:
                    safe_cols.append(f"[{col_name}]")
            
            if safe_cols:
                safe_query = f"SELECT TOP {limit} {', '.join(safe_cols)} FROM {schema}.{table}"
                return self.execute_query(safe_query)
            else:
                query = f"SELECT TOP {limit} * FROM {schema}.{table}"
                return self.execute_query(query)
        except Exception as e:
            print(f"Error getting table data: {e}")
            import traceback
            traceback.print_exc()
            return pd.DataFrame()

    def get_schemas(self) -> pd.DataFrame:
        """Get all schemas in the database"""
        query = "SELECT DISTINCT TABLE_SCHEMA FROM INFORMATION_SCHEMA.TABLES ORDER BY TABLE_SCHEMA"
        return self.execute_query(query)

    def get_tables(self, schema: str = None) -> pd.DataFrame:
        """Get all tables, optionally filtered by schema"""
        if schema:
            query = f"""
            SELECT TABLE_SCHEMA, TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = '{schema}' AND TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_SCHEMA, TABLE_NAME
            """
        else:
            query = """
            SELECT TABLE_SCHEMA, TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_SCHEMA, TABLE_NAME
            """
        return self.execute_query(query)

    def get_table_schema(self, schema: str, table: str) -> pd.DataFrame:
        """Get detailed column information for a table"""
        query = f"""
        SELECT 
            COLUMN_NAME,
            DATA_TYPE,
            IS_NULLABLE,
            CHARACTER_MAXIMUM_LENGTH,
            NUMERIC_PRECISION,
            NUMERIC_SCALE,
            COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = '{schema}' AND TABLE_NAME = '{table}'
        ORDER BY ORDINAL_POSITION
        """
        return self.execute_query(query)

    def get_sample_data(self, schema: str, table: str, limit: int = 5) -> pd.DataFrame:
        """Get sample data from a table"""
        return self.get_table_data(schema, table, limit=limit)

    def build_schema_context(self, schemas: list = None, key_tables_only: bool = True) -> str:
        """Build compact schema - only key tables and important columns, filtered by allowed tables"""
        key_tables = {
            'Sales': ['Customers', 'Orders', 'OrderLines', 'Invoices'],
            'Warehouse': ['StockItems', 'StockItemHoldings'],
        }
        
        # Normalize allowed tables to lowercase for comparison
        allowed_tables_lower = [table.lower() for table in (schemas or [])]
        
        context_parts = ["## Key Tables\n"]
        
        for schema, tables in key_tables.items():
            # Filter tables if schemas are provided
            filtered_tables = []
            for table in tables:
                # Check if table name matches any allowed table (case-insensitive)
                # Match by full table name or just the table name part
                table_lower = table.lower()
                schema_lower = schema.lower()
                
                # Check if table name matches directly (e.g., "customers" matches "Customers")
                # Or if schema.table matches (e.g., "sales.customers" matches "Sales.Customers")
                if not schemas:
                    # No filtering, include all tables
                    filtered_tables.append(table)
                else:
                    # Check if this table should be included
                    should_include = False
                    for allowed in allowed_tables_lower:
                        # Match exact table name (case-insensitive)
                        if allowed == table_lower:
                            should_include = True
                            break
                        # Match schema.table format (e.g., "sales.customers")
                        if '.' in allowed:
                            parts = allowed.split('.')
                            if len(parts) == 2 and parts[0].lower() == schema_lower and parts[1].lower() == table_lower:
                                should_include = True
                                break
                        # Match schema name (e.g., "sales" matches all Sales tables)
                        elif allowed == schema_lower:
                            should_include = True
                            break
                    
                    if should_include:
                        filtered_tables.append(table)
            
            if filtered_tables:
                context_parts.append(f"\n### {schema}\n")
                for table in filtered_tables:
                    col_info = self.get_table_schema(schema, table)
                    if not col_info.empty:
                        cols = col_info.head(10)
                        col_list = [f"{row['COLUMN_NAME']}:{row['DATA_TYPE']}" 
                                for _, row in cols.iterrows()]
                        context_parts.append(f"{schema}.{table}({', '.join(col_list)})\n")
        
        return "\n".join(context_parts)  
              
    def close(self):
        """Close the database connection"""
        if self.connection:
            self.connection.close()
            print("Database connection closed")
        else:
            print("No database connection to close")

if __name__ == "__main__":
    db = DatabaseConnection()
    db.connect()
    
    print(db.build_schema_context())

    # Get all tables
    # all_tables = db.get_tables()
    # print(all_tables)

    # # Or get tables by schema
    # sales_tables = db.get_tables(schema='Sales')
    # print(sales_tables)

    # # Or get all schemas first
    # schemas = db.get_schemas()
    # print(schemas)
    
    db.close()
