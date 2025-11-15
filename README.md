# AI DataBridge

A full-stack application for managing and sharing organization data through Model Context Protocol (MCP) instances. Create secure, shareable MCP endpoints that provide LLMs with controlled access to specific database tables.

## Features

- Create, view, and delete MCP instances with category-based access control
- OpenAI-powered SQL query generation
- Visual color-coded instance cards
- Modern UI built with Next.js and shadcn/ui

## Prerequisites

- Python 3.12+, Node.js 20+, pnpm/npm
- SQL Server database
- OpenAI API key

## Tech Stack

**Backend:** FastAPI, FastMCP, OpenAI, pymssql, pandas  
**Frontend:** Next.js 16, TypeScript, shadcn/ui, Tailwind CSS

## Setup

### Backend

```bash
cd backend
uv sync  # or pip install -r requirements.txt
```

Create `.env`:
```env
OPENAI_API_KEY=your_key
DB_SERVER=your_server
DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_password
```

Run: `python main.py` or `uvicorn main:app --reload --port 8000`

### Frontend

```bash
cd frontend
pnpm install
```

Optional `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run: `pnpm dev`

## Usage

1. Click "Add MCP Server" and fill in the form
2. Select allowed table categories: Sales, Purchasing, Warehouse, Application
3. Copy the generated endpoint URL: `/llm/mcp?instance_id={uuid}`
4. Use with MCP Inspector or any MCP-compatible client

### MCP Tools

- `get_database_context` - Returns filtered database schema
- `generate_sql_query` - Generates SQL using OpenAI
- `execute_query` - Executes SQL queries

## API Endpoints

- `GET /mcp` - List all instances
- `GET /mcp/{id}` - Get instance by ID
- `POST /mcp` - Create instance `{name, description, allowedTables}`
- `DELETE /mcp/{id}` - Delete instance
- `/llm/mcp?instance_id={id}` - MCP server endpoint

## Deployment

**Backend:** Set environment variables, ensure `mcp.json` persistence, deploy FastAPI app  
**Frontend:** Set `NEXT_PUBLIC_API_URL`, deploy Next.js app
