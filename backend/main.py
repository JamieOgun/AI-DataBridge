from fastapi import FastAPI
from routers import api
from routers.mcp import mcp_app
import uvicorn

app = FastAPI(lifespan=mcp_app.lifespan)

app.include_router(api.router)
app.mount("/llm", mcp_app)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)