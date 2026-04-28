from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
from routes import (
    auth_routes,
    product_routes,
    category_routes,
    order_routes,
    wishlist_routes,
    chat_routes,
    user_routes,
    cart_routes,
    checkout_routes,
    admin_routes,
)

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="IRA AI Fashion API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_routes.router)
app.include_router(product_routes.router)
app.include_router(category_routes.router)
app.include_router(order_routes.router)
app.include_router(wishlist_routes.router)
app.include_router(chat_routes.router)
app.include_router(user_routes.router)
app.include_router(cart_routes.router)
app.include_router(checkout_routes.router)
app.include_router(admin_routes.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "IRA AI Fashion API"}


UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="api_uploads")
