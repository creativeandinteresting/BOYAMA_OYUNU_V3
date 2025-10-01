from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import base64


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'coloring_game_db')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class ColoringPage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str  # animals, vehicles, nature
    difficulty: str  # easy, medium, hard
    svg_content: str
    thumbnail: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ColoringPageCreate(BaseModel):
    name: str
    category: str
    difficulty: str
    svg_content: str
    thumbnail: Optional[str] = None

class UserArtwork(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    coloring_page_id: str
    artwork_data: str  # base64 encoded image
    completed_at: datetime = Field(default_factory=datetime.utcnow)
    title: Optional[str] = None

class UserArtworkCreate(BaseModel):
    user_id: Optional[str] = None
    coloring_page_id: str
    artwork_data: str
    title: Optional[str] = None

class Sticker(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    svg_content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Coloring Pages Routes
@api_router.get("/coloring-pages", response_model=List[ColoringPage])
async def get_coloring_pages(category: Optional[str] = None):
    query = {}
    if category:
        query['category'] = category
    
    pages = await db.coloring_pages.find(query).to_list(100)
    return [ColoringPage(**page) for page in pages]

@api_router.post("/coloring-pages", response_model=ColoringPage)
async def create_coloring_page(page: ColoringPageCreate):
    page_dict = page.dict()
    page_obj = ColoringPage(**page_dict)
    await db.coloring_pages.insert_one(page_obj.dict())
    return page_obj

@api_router.get("/coloring-pages/{page_id}", response_model=ColoringPage)
async def get_coloring_page(page_id: str):
    page = await db.coloring_pages.find_one({"id": page_id})
    if not page:
        raise HTTPException(status_code=404, detail="Coloring page not found")
    return ColoringPage(**page)

# User Artwork Routes
@api_router.get("/artworks", response_model=List[UserArtwork])
async def get_user_artworks(user_id: Optional[str] = None):
    query = {}
    if user_id:
        query['user_id'] = user_id
    
    artworks = await db.user_artworks.find(query).sort("completed_at", -1).to_list(100)
    return [UserArtwork(**artwork) for artwork in artworks]

@api_router.post("/artworks", response_model=UserArtwork)
async def save_user_artwork(artwork: UserArtworkCreate):
    artwork_dict = artwork.dict()
    artwork_obj = UserArtwork(**artwork_dict)
    await db.user_artworks.insert_one(artwork_obj.dict())
    return artwork_obj

@api_router.delete("/artworks/{artwork_id}")
async def delete_user_artwork(artwork_id: str):
    result = await db.user_artworks.delete_one({"id": artwork_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Artwork not found")
    return {"message": "Artwork deleted successfully"}

# Stickers Routes
@api_router.get("/stickers", response_model=List[Sticker])
async def get_stickers(category: Optional[str] = None):
    query = {}
    if category:
        query['category'] = category
    
    stickers = await db.stickers.find(query).to_list(100)
    return [Sticker(**sticker) for sticker in stickers]

# Initialize default coloring pages and stickers
@api_router.post("/initialize-data")
async def initialize_default_data():
    # Check if data already exists
    existing_pages = await db.coloring_pages.count_documents({})
    if existing_pages > 0:
        return {"message": "Data already initialized"}
    
    # Sample coloring pages
    sample_pages = [
        {
            "name": "Sevimli Kedi",
            "category": "animals",
            "difficulty": "medium",
            "svg_content": "<svg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'><circle cx='150' cy='120' r='60' fill='none' stroke='black' stroke-width='3'/><circle cx='130' cy='110' r='5' fill='black'/><circle cx='170' cy='110' r='5' fill='black'/><path d='M140 130 Q150 140 160 130' stroke='black' stroke-width='2' fill='none'/><circle cx='120' cy='80' r='15' fill='none' stroke='black' stroke-width='3'/><circle cx='180' cy='80' r='15' fill='none' stroke='black' stroke-width='3'/><rect x='140' y='180' width='20' height='40' fill='none' stroke='black' stroke-width='3'/><ellipse cx='100' cy='200' rx='15' ry='8' fill='none' stroke='black' stroke-width='3'/><ellipse cx='200' cy='200' rx='15' ry='8' fill='none' stroke='black' stroke-width='3'/><path d='M145 260 Q150 280 155 260' stroke='black' stroke-width='3' fill='none'/></svg>"
        },
        {
            "name": "Hızlı Araba",
            "category": "vehicles",
            "difficulty": "medium",
            "svg_content": "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><rect x='50' y='80' width='200' height='60' rx='10' fill='none' stroke='black' stroke-width='3'/><rect x='80' y='60' width='140' height='30' rx='5' fill='none' stroke='black' stroke-width='3'/><circle cx='100' cy='160' r='20' fill='none' stroke='black' stroke-width='3'/><circle cx='200' cy='160' r='20' fill='none' stroke='black' stroke-width='3'/><rect x='60' y='100' width='30' height='20' rx='3' fill='none' stroke='black' stroke-width='2'/><rect x='210' y='100' width='30' height='20' rx='3' fill='none' stroke='black' stroke-width='2'/></svg>"
        },
        {
            "name": "Güzel Çiçek",
            "category": "nature",
            "difficulty": "medium",
            "svg_content": "<svg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'><circle cx='150' cy='150' r='20' fill='none' stroke='black' stroke-width='3'/><ellipse cx='150' cy='100' rx='15' ry='30' fill='none' stroke='black' stroke-width='3'/><ellipse cx='150' cy='200' rx='15' ry='30' fill='none' stroke='black' stroke-width='3'/><ellipse cx='100' cy='150' rx='30' ry='15' fill='none' stroke='black' stroke-width='3'/><ellipse cx='200' cy='150' rx='30' ry='15' fill='none' stroke='black' stroke-width='3'/><ellipse cx='115' cy='115' rx='20' ry='20' fill='none' stroke='black' stroke-width='3' transform='rotate(-45 115 115)'/><ellipse cx='185' cy='115' rx='20' ry='20' fill='none' stroke='black' stroke-width='3' transform='rotate(45 185 115)'/><ellipse cx='185' cy='185' rx='20' ry='20' fill='none' stroke='black' stroke-width='3' transform='rotate(-45 185 185)'/><ellipse cx='115' cy='185' rx='20' ry='20' fill='none' stroke='black' stroke-width='3' transform='rotate(45 115 185)'/><line x1='150' y1='250' x2='150' y2='200' stroke='black' stroke-width='4'/><path d='M130 220 Q140 210 150 220' stroke='black' stroke-width='2' fill='none'/><path d='M170 220 Q160 210 150 220' stroke='black' stroke-width='2' fill='none'/></svg>"
        }
    ]
    
    # Sample stickers
    sample_stickers = [
        {
            "name": "Yıldız",
            "category": "shapes",
            "svg_content": "<svg viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'><polygon points='30,5 35,20 50,20 38,30 42,45 30,37 18,45 22,30 10,20 25,20' fill='yellow' stroke='orange' stroke-width='2'/></svg>"
        },
        {
            "name": "Kalp",
            "category": "shapes",
            "svg_content": "<svg viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'><path d='M30,45 C20,35 5,25 15,15 C25,5 30,15 30,15 C30,15 35,5 45,15 C55,25 40,35 30,45z' fill='red' stroke='darkred' stroke-width='2'/></svg>"
        },
        {
            "name": "Gülen Yüz",
            "category": "emoji",
            "svg_content": "<svg viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'><circle cx='30' cy='30' r='25' fill='yellow' stroke='orange' stroke-width='2'/><circle cx='22' cy='25' r='3' fill='black'/><circle cx='38' cy='25' r='3' fill='black'/><path d='M20 35 Q30 45 40 35' stroke='black' stroke-width='3' fill='none'/></svg>"
        }
    ]
    
    # Insert sample data
    for page_data in sample_pages:
        page_obj = ColoringPage(**page_data)
        await db.coloring_pages.insert_one(page_obj.dict())
    
    for sticker_data in sample_stickers:
        sticker_obj = Sticker(**sticker_data)
        await db.stickers.insert_one(sticker_obj.dict())
    
    return {"message": "Default data initialized successfully"}

# Health check
@api_router.get("/")
async def root():
    return {"message": "Coloring Game API is running"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()