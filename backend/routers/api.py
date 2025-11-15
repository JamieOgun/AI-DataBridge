from fastapi import APIRouter

router = APIRouter()

BASE_URL = "https://enterprise-ai.onrender.com"

# def _generate_mcp_instance_id(length: int = 12) -> str:
#     alphabet = string.ascii_letters + string.digits
#     return "".join(secrets.choice(alphabet) for _ in range(length))

@router.get("/")
def read_root():
    return {"message": "Hello, World!"}

@router.get("/llm/mcp")
def get_mcp():
    return {"mcp_url": f"{BASE_URL}/llm/mcp/"}