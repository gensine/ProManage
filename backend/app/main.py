from fastapi import FastAPI, Request, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db
from app.api import auth, projects, tasks, dashboard

limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.RATE_LIMIT_MAX}/15minutes"])

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    await init_db()
    yield
    # Shutdown actions

app = FastAPI(
    title="Project Management System API",
    description="RESTful API built with FastAPI, PostgreSQL / Async SQLAlchemy, and JWT Authentication",
    version="1.0.0",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Configuration
origins = settings.cors_origins_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Global Exception Handler for Standard Response Format
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    details = []
    for err in exc.errors():
        field_path = " -> ".join([str(p) for p in err.get("loc", []) if str(p) != "body"])
        details.append({
            "field": field_path or "request",
            "message": err.get("msg", "Invalid input")
        })
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input validation failed",
                "details": details
            }
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "code" in exc.detail:
        error_payload = {
            "code": exc.detail.get("code", "ERROR"),
            "message": exc.detail.get("message", exc.detail)
        }
    else:
        error_payload = {
            "code": "BAD_REQUEST" if exc.status_code < 500 else "SERVER_ERROR",
            "message": str(exc.detail)
        }
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": error_payload
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred on the server"
            }
        }
    )

# Health check
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "environment": settings.NODE_ENV}

# Include API Routers under /api
app.include_router(auth.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
