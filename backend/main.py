from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import uuid
import shutil
from database import engine, Base
from routes import auth_routes, product_routes, category_routes, order_routes, wishlist_routes, chat_routes

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

# Ensure uploads directory exists
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# Mount static files
app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(auth_routes.router)
app.include_router(product_routes.router)
app.include_router(category_routes.router)
app.include_router(order_routes.router)
app.include_router(wishlist_routes.router)
app.include_router(chat_routes.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "IRA AI Fashion API"}


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    # Validate file type (optional but good)
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    file_ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Return the public URL
    return {"url": f"/api/uploads/{filename}"}
