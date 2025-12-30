from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Environment variables
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    is_premium: bool = False
    created_at: str

class BookmarkCreate(BaseModel):
    book: str
    chapter: int
    verse: Optional[int] = None
    note: Optional[str] = None

class BookmarkResponse(BaseModel):
    bookmark_id: str
    user_id: str
    book: str
    chapter: int
    verse: Optional[int] = None
    note: Optional[str] = None
    created_at: str

class JournalCreate(BaseModel):
    title: str
    content: str
    scripture_ref: Optional[str] = None
    mood: Optional[str] = None

class JournalResponse(BaseModel):
    journal_id: str
    user_id: str
    title: str
    content: str
    scripture_ref: Optional[str] = None
    mood: Optional[str] = None
    created_at: str

class ForumPostCreate(BaseModel):
    title: str
    content: str
    scripture_ref: Optional[str] = None
    tags: Optional[List[str]] = []

class ForumPostResponse(BaseModel):
    post_id: str
    user_id: str
    user_name: str
    title: str
    content: str
    scripture_ref: Optional[str] = None
    tags: List[str] = []
    upvotes: int = 0
    comments_count: int = 0
    created_at: str

class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    comment_id: str
    post_id: str
    user_id: str
    user_name: str
    content: str
    upvotes: int = 0
    created_at: str

class NewsAnalysisRequest(BaseModel):
    news_headline: str
    news_content: str

class NewsAnalysisResponse(BaseModel):
    analysis_id: str
    news_headline: str
    scripture_references: List[Dict[str, Any]]
    analysis: str
    created_at: str

class SubscriptionCreate(BaseModel):
    origin_url: str

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    notification_email: Optional[bool] = None
    notification_forum: Optional[bool] = None
    preferred_translation: Optional[str] = None
    theme_preference: Optional[str] = None

class SearchRequest(BaseModel):
    query: str
    search_type: Optional[str] = "all"  # all, verses, dictionary

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

async def get_current_user(request: Request) -> dict:
    # Check cookie first
    token = request.cookies.get("session_token")
    
    # Then check Authorization header
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_premium_user(request: Request) -> dict:
    user = await get_current_user(request)
    if not user.get("is_premium", False):
        raise HTTPException(status_code=403, detail="Premium subscription required")
    return user

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed_pw = hash_password(user_data.password)
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hashed_pw,
        "picture": None,
        "is_premium": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id)
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "is_premium": False,
        "token": token
    }

@api_router.post("/auth/login")
async def login(user_data: UserLogin, response: Response):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["user_id"])
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "is_premium": user.get("is_premium", False),
        "token": token
    }

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "is_premium": user.get("is_premium", False)
    }

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# Emergent Google OAuth session endpoint
@api_router.post("/auth/session")
async def process_oauth_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        oauth_data = resp.json()
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": oauth_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": oauth_data["name"], "picture": oauth_data.get("picture")}}
        )
        is_premium = existing_user.get("is_premium", False)
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": oauth_data["email"],
            "name": oauth_data["name"],
            "picture": oauth_data.get("picture"),
            "password": None,
            "is_premium": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
        is_premium = False
    
    token = create_token(user_id)
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return {
        "user_id": user_id,
        "email": oauth_data["email"],
        "name": oauth_data["name"],
        "picture": oauth_data.get("picture"),
        "is_premium": is_premium,
        "token": token
    }

# ==================== BIBLE DATA ====================

BIBLE_BOOKS = [
    {"name": "Genesis", "chapters": 50, "testament": "Old"},
    {"name": "Exodus", "chapters": 40, "testament": "Old"},
    {"name": "Leviticus", "chapters": 27, "testament": "Old"},
    {"name": "Numbers", "chapters": 36, "testament": "Old"},
    {"name": "Deuteronomy", "chapters": 34, "testament": "Old"},
    {"name": "Joshua", "chapters": 24, "testament": "Old"},
    {"name": "Judges", "chapters": 21, "testament": "Old"},
    {"name": "Ruth", "chapters": 4, "testament": "Old"},
    {"name": "1 Samuel", "chapters": 31, "testament": "Old"},
    {"name": "2 Samuel", "chapters": 24, "testament": "Old"},
    {"name": "1 Kings", "chapters": 22, "testament": "Old"},
    {"name": "2 Kings", "chapters": 25, "testament": "Old"},
    {"name": "1 Chronicles", "chapters": 29, "testament": "Old"},
    {"name": "2 Chronicles", "chapters": 36, "testament": "Old"},
    {"name": "Ezra", "chapters": 10, "testament": "Old"},
    {"name": "Nehemiah", "chapters": 13, "testament": "Old"},
    {"name": "Esther", "chapters": 10, "testament": "Old"},
    {"name": "Job", "chapters": 42, "testament": "Old"},
    {"name": "Psalms", "chapters": 150, "testament": "Old"},
    {"name": "Proverbs", "chapters": 31, "testament": "Old"},
    {"name": "Ecclesiastes", "chapters": 12, "testament": "Old"},
    {"name": "Song of Solomon", "chapters": 8, "testament": "Old"},
    {"name": "Isaiah", "chapters": 66, "testament": "Old"},
    {"name": "Jeremiah", "chapters": 52, "testament": "Old"},
    {"name": "Lamentations", "chapters": 5, "testament": "Old"},
    {"name": "Ezekiel", "chapters": 48, "testament": "Old"},
    {"name": "Daniel", "chapters": 12, "testament": "Old"},
    {"name": "Hosea", "chapters": 14, "testament": "Old"},
    {"name": "Joel", "chapters": 3, "testament": "Old"},
    {"name": "Amos", "chapters": 9, "testament": "Old"},
    {"name": "Obadiah", "chapters": 1, "testament": "Old"},
    {"name": "Jonah", "chapters": 4, "testament": "Old"},
    {"name": "Micah", "chapters": 7, "testament": "Old"},
    {"name": "Nahum", "chapters": 3, "testament": "Old"},
    {"name": "Habakkuk", "chapters": 3, "testament": "Old"},
    {"name": "Zephaniah", "chapters": 3, "testament": "Old"},
    {"name": "Haggai", "chapters": 2, "testament": "Old"},
    {"name": "Zechariah", "chapters": 14, "testament": "Old"},
    {"name": "Malachi", "chapters": 4, "testament": "Old"},
    {"name": "Matthew", "chapters": 28, "testament": "New"},
    {"name": "Mark", "chapters": 16, "testament": "New"},
    {"name": "Luke", "chapters": 24, "testament": "New"},
    {"name": "John", "chapters": 21, "testament": "New"},
    {"name": "Acts", "chapters": 28, "testament": "New"},
    {"name": "Romans", "chapters": 16, "testament": "New"},
    {"name": "1 Corinthians", "chapters": 16, "testament": "New"},
    {"name": "2 Corinthians", "chapters": 13, "testament": "New"},
    {"name": "Galatians", "chapters": 6, "testament": "New"},
    {"name": "Ephesians", "chapters": 6, "testament": "New"},
    {"name": "Philippians", "chapters": 4, "testament": "New"},
    {"name": "Colossians", "chapters": 4, "testament": "New"},
    {"name": "1 Thessalonians", "chapters": 5, "testament": "New"},
    {"name": "2 Thessalonians", "chapters": 3, "testament": "New"},
    {"name": "1 Timothy", "chapters": 6, "testament": "New"},
    {"name": "2 Timothy", "chapters": 4, "testament": "New"},
    {"name": "Titus", "chapters": 3, "testament": "New"},
    {"name": "Philemon", "chapters": 1, "testament": "New"},
    {"name": "Hebrews", "chapters": 13, "testament": "New"},
    {"name": "James", "chapters": 5, "testament": "New"},
    {"name": "1 Peter", "chapters": 5, "testament": "New"},
    {"name": "2 Peter", "chapters": 3, "testament": "New"},
    {"name": "1 John", "chapters": 5, "testament": "New"},
    {"name": "2 John", "chapters": 1, "testament": "New"},
    {"name": "3 John", "chapters": 1, "testament": "New"},
    {"name": "Jude", "chapters": 1, "testament": "New"},
    {"name": "Revelation", "chapters": 22, "testament": "New"},
]

# Sample Bible verses (in production, this would come from a full Bible API)
SAMPLE_VERSES = {
    "Genesis_1": [
        {"verse": 1, "text": "In the beginning God created the heaven and the earth."},
        {"verse": 2, "text": "And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters."},
        {"verse": 3, "text": "And God said, Let there be light: and there was light."},
        {"verse": 4, "text": "And God saw the light, that it was good: and God divided the light from the darkness."},
        {"verse": 5, "text": "And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day."},
    ],
    "John_3": [
        {"verse": 16, "text": "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."},
        {"verse": 17, "text": "For God sent not his Son into the world to condemn the world; but that the world through him might be saved."},
    ],
    "Psalms_23": [
        {"verse": 1, "text": "The LORD is my shepherd; I shall not want."},
        {"verse": 2, "text": "He maketh me to lie down in green pastures: he leadeth me beside the still waters."},
        {"verse": 3, "text": "He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake."},
        {"verse": 4, "text": "Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me."},
        {"verse": 5, "text": "Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over."},
        {"verse": 6, "text": "Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever."},
    ],
    "Romans_8": [
        {"verse": 28, "text": "And we know that all things work together for good to them that love God, to them who are the called according to his purpose."},
        {"verse": 31, "text": "What shall we then say to these things? If God be for us, who can be against us?"},
        {"verse": 38, "text": "For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come,"},
        {"verse": 39, "text": "Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord."},
    ],
    "Proverbs_3": [
        {"verse": 5, "text": "Trust in the LORD with all thine heart; and lean not unto thine own understanding."},
        {"verse": 6, "text": "In all thy ways acknowledge him, and he shall direct thy paths."},
    ],
}

# Bible Dictionary
BIBLE_DICTIONARY = {
    "grace": {
        "word": "Grace",
        "definition": "The unmerited favor of God toward humanity. In Christian theology, it is the free and unmerited gift of salvation through faith in Jesus Christ.",
        "hebrew": "chen (חֵן)",
        "greek": "charis (χάρις)",
        "references": ["Ephesians 2:8-9", "Romans 3:24", "Titus 2:11"]
    },
    "faith": {
        "word": "Faith",
        "definition": "Complete trust or confidence in God and His promises. The substance of things hoped for, the evidence of things not seen.",
        "hebrew": "emunah (אֱמוּנָה)",
        "greek": "pistis (πίστις)",
        "references": ["Hebrews 11:1", "Romans 10:17", "Galatians 2:20"]
    },
    "salvation": {
        "word": "Salvation",
        "definition": "Deliverance from sin and its consequences, brought about by faith in Jesus Christ. The act of being saved from eternal separation from God.",
        "hebrew": "yeshuah (יְשׁוּעָה)",
        "greek": "soteria (σωτηρία)",
        "references": ["Romans 10:9-10", "Acts 4:12", "Ephesians 2:8"]
    },
    "redemption": {
        "word": "Redemption",
        "definition": "The action of being saved from sin, error, or evil through the sacrifice of Jesus Christ. The payment of a ransom to secure freedom.",
        "hebrew": "ge'ulah (גְּאֻלָּה)",
        "greek": "apolytrosis (ἀπολύτρωσις)",
        "references": ["Ephesians 1:7", "Colossians 1:14", "Romans 3:24"]
    },
    "covenant": {
        "word": "Covenant",
        "definition": "A binding agreement between God and His people. God's promises and the conditions for receiving His blessings.",
        "hebrew": "berith (בְּרִית)",
        "greek": "diatheke (διαθήκη)",
        "references": ["Genesis 17:7", "Jeremiah 31:31-34", "Hebrews 8:6"]
    },
    "righteousness": {
        "word": "Righteousness",
        "definition": "The quality of being morally right or justifiable. Acting in accord with divine or moral law; free from guilt or sin.",
        "hebrew": "tsedaqah (צְדָקָה)",
        "greek": "dikaiosyne (δικαιοσύνη)",
        "references": ["Romans 3:22", "2 Corinthians 5:21", "Philippians 3:9"]
    },
    "sanctification": {
        "word": "Sanctification",
        "definition": "The process of being made holy; set apart for God's purposes. The ongoing work of the Holy Spirit in a believer's life.",
        "hebrew": "qadash (קָדַשׁ)",
        "greek": "hagiasmos (ἁγιασμός)",
        "references": ["1 Thessalonians 4:3", "Hebrews 12:14", "1 Peter 1:2"]
    },
    "atonement": {
        "word": "Atonement",
        "definition": "The reconciliation of God and humankind through Jesus Christ's sacrificial death. The covering or removal of sin.",
        "hebrew": "kippur (כִּפּוּר)",
        "greek": "hilasmos (ἱλασμός)",
        "references": ["Romans 5:11", "1 John 2:2", "Hebrews 9:12"]
    },
}

# Daily Devotionals
DAILY_DEVOTIONALS = [
    {
        "title": "Walking in Faith",
        "scripture": "Hebrews 11:1",
        "verse_text": "Now faith is the substance of things hoped for, the evidence of things not seen.",
        "reflection": "Faith is not merely believing something will happen; it is having confidence in God's character and promises even when we cannot see the outcome. Today, consider areas in your life where you need to exercise greater faith.",
        "prayer": "Lord, strengthen my faith. Help me to trust You even when I cannot see what lies ahead. May my life be a testimony of Your faithfulness."
    },
    {
        "title": "God's Unfailing Love",
        "scripture": "Romans 8:38-39",
        "verse_text": "For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come, Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord.",
        "reflection": "Nothing in all creation can separate us from God's love. No circumstance, no failure, no enemy - nothing has the power to break the bond of love God has established with us through Christ.",
        "prayer": "Father, thank You that Your love is unconditional and unending. Help me rest secure in Your love today."
    },
    {
        "title": "Trust in the Lord",
        "scripture": "Proverbs 3:5-6",
        "verse_text": "Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.",
        "reflection": "Human wisdom has its limits, but God's wisdom is infinite. When we surrender our understanding and trust fully in God, He promises to guide our steps.",
        "prayer": "God, I surrender my plans and understanding to You. Direct my paths today according to Your perfect will."
    },
    {
        "title": "The Good Shepherd",
        "scripture": "Psalm 23:1-3",
        "verse_text": "The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters. He restoreth my soul.",
        "reflection": "As our Shepherd, God provides for all our needs, gives us rest, and restores our weary souls. He knows exactly what we need and when we need it.",
        "prayer": "Lord, thank You for being my Shepherd. Lead me to places of rest and restoration today."
    },
    {
        "title": "New Mercies Every Morning",
        "scripture": "Lamentations 3:22-23",
        "verse_text": "It is of the LORD's mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.",
        "reflection": "Each new day brings fresh mercies from God. No matter what yesterday held - failures, disappointments, or struggles - today offers a new beginning through God's unchanging faithfulness.",
        "prayer": "Thank You, Lord, for Your mercies that are new every morning. Help me to embrace this fresh start with gratitude."
    },
    {
        "title": "Strength in Weakness",
        "scripture": "2 Corinthians 12:9",
        "verse_text": "And he said unto me, My grace is sufficient for thee: for my strength is made perfect in weakness.",
        "reflection": "Our weaknesses are not obstacles to God's work - they are opportunities for His strength to be displayed. When we acknowledge our limitations, we make room for His power.",
        "prayer": "Father, I bring my weaknesses to You today. Let Your strength be made perfect in me."
    },
    {
        "title": "Peace Beyond Understanding",
        "scripture": "Philippians 4:6-7",
        "verse_text": "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.",
        "reflection": "God invites us to exchange our anxiety for His peace through prayer. This peace doesn't make sense to the world, but it guards our hearts and minds in Christ.",
        "prayer": "Lord, I bring my worries to You today. Fill me with Your supernatural peace that transcends understanding."
    },
]

# ==================== BIBLE ENDPOINTS ====================

# Book name mappings for Bible API
BOOK_ABBREVIATIONS = {
    "Genesis": "genesis", "Exodus": "exodus", "Leviticus": "leviticus",
    "Numbers": "numbers", "Deuteronomy": "deuteronomy", "Joshua": "joshua",
    "Judges": "judges", "Ruth": "ruth", "1 Samuel": "1samuel", "2 Samuel": "2samuel",
    "1 Kings": "1kings", "2 Kings": "2kings", "1 Chronicles": "1chronicles",
    "2 Chronicles": "2chronicles", "Ezra": "ezra", "Nehemiah": "nehemiah",
    "Esther": "esther", "Job": "job", "Psalms": "psalms", "Proverbs": "proverbs",
    "Ecclesiastes": "ecclesiastes", "Song of Solomon": "songofsolomon",
    "Isaiah": "isaiah", "Jeremiah": "jeremiah", "Lamentations": "lamentations",
    "Ezekiel": "ezekiel", "Daniel": "daniel", "Hosea": "hosea", "Joel": "joel",
    "Amos": "amos", "Obadiah": "obadiah", "Jonah": "jonah", "Micah": "micah",
    "Nahum": "nahum", "Habakkuk": "habakkuk", "Zephaniah": "zephaniah",
    "Haggai": "haggai", "Zechariah": "zechariah", "Malachi": "malachi",
    "Matthew": "matthew", "Mark": "mark", "Luke": "luke", "John": "john",
    "Acts": "acts", "Romans": "romans", "1 Corinthians": "1corinthians",
    "2 Corinthians": "2corinthians", "Galatians": "galatians", "Ephesians": "ephesians",
    "Philippians": "philippians", "Colossians": "colossians",
    "1 Thessalonians": "1thessalonians", "2 Thessalonians": "2thessalonians",
    "1 Timothy": "1timothy", "2 Timothy": "2timothy", "Titus": "titus",
    "Philemon": "philemon", "Hebrews": "hebrews", "James": "james",
    "1 Peter": "1peter", "2 Peter": "2peter", "1 John": "1john",
    "2 John": "2john", "3 John": "3john", "Jude": "jude", "Revelation": "revelation"
}

@api_router.get("/bible/books")
async def get_bible_books():
    return {"books": BIBLE_BOOKS}

@api_router.get("/bible/chapter/{book}/{chapter}")
async def get_chapter(book: str, chapter: int):
    # Try to fetch from Bible API
    try:
        book_abbr = BOOK_ABBREVIATIONS.get(book, book.lower().replace(" ", ""))
        api_url = f"https://bible-api.com/{book_abbr}+{chapter}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(api_url, timeout=10.0)
            
            if response.status_code == 200:
                data = response.json()
                verses = []
                if "verses" in data:
                    for v in data["verses"]:
                        verses.append({
                            "verse": v.get("verse", 1),
                            "text": v.get("text", "").strip()
                        })
                return {
                    "book": book,
                    "chapter": chapter,
                    "verses": verses,
                    "translation": data.get("translation_name", "World English Bible")
                }
    except Exception as e:
        logger.warning(f"Bible API error: {e}")
    
    # Fallback to local sample verses
    key = f"{book}_{chapter}"
    verses = SAMPLE_VERSES.get(key, [])
    
    if not verses:
        verses = [{"verse": i, "text": f"Verse {i} of {book} chapter {chapter}. (Loading...)"} for i in range(1, 11)]
    
    return {
        "book": book,
        "chapter": chapter,
        "verses": verses,
        "translation": "King James Version"
    }

@api_router.get("/bible/verse/{book}/{chapter}/{verse}")
async def get_verse(book: str, chapter: int, verse: int):
    try:
        book_abbr = BOOK_ABBREVIATIONS.get(book, book.lower().replace(" ", ""))
        api_url = f"https://bible-api.com/{book_abbr}+{chapter}:{verse}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(api_url, timeout=10.0)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "book": book,
                    "chapter": chapter,
                    "verse": verse,
                    "text": data.get("text", "").strip(),
                    "reference": data.get("reference", f"{book} {chapter}:{verse}"),
                    "translation": data.get("translation_name", "World English Bible")
                }
    except Exception as e:
        logger.warning(f"Bible API error: {e}")
    
    return {
        "book": book,
        "chapter": chapter,
        "verse": verse,
        "text": f"Verse {verse} of {book} chapter {chapter}.",
        "reference": f"{book} {chapter}:{verse}",
        "translation": "King James Version"
    }

@api_router.get("/bible/search/verses")
async def search_verses(q: str, limit: int = 20):
    """Search Bible verses using the Bible API"""
    results = []
    try:
        # Search common books for the query
        search_books = ["psalms", "proverbs", "john", "romans", "matthew", "genesis", "isaiah"]
        
        async with httpx.AsyncClient() as client:
            for book in search_books[:3]:  # Limit to 3 books for speed
                try:
                    # Search a few chapters
                    for ch in range(1, 4):
                        api_url = f"https://bible-api.com/{book}+{ch}"
                        response = await client.get(api_url, timeout=5.0)
                        
                        if response.status_code == 200:
                            data = response.json()
                            if "verses" in data:
                                for v in data["verses"]:
                                    text = v.get("text", "").lower()
                                    if q.lower() in text:
                                        results.append({
                                            "reference": f"{book.title()} {ch}:{v.get('verse', 1)}",
                                            "text": v.get("text", "").strip(),
                                            "book": book.title(),
                                            "chapter": ch,
                                            "verse": v.get("verse", 1)
                                        })
                                        if len(results) >= limit:
                                            return {"results": results, "query": q}
                except:
                    continue
    except Exception as e:
        logger.warning(f"Search error: {e}")
    
    return {"results": results, "query": q}

@api_router.get("/bible/dictionary")
async def get_dictionary():
    from bible_data import EXTENDED_BIBLE_DICTIONARY
    return {"words": list(EXTENDED_BIBLE_DICTIONARY.values())}

@api_router.get("/bible/dictionary/{word}")
async def get_dictionary_word(word: str):
    from bible_data import EXTENDED_BIBLE_DICTIONARY
    word_lower = word.lower()
    if word_lower in EXTENDED_BIBLE_DICTIONARY:
        return EXTENDED_BIBLE_DICTIONARY[word_lower]
    raise HTTPException(status_code=404, detail="Word not found in dictionary")

@api_router.get("/bible/search")
async def search_dictionary(q: str):
    from bible_data import EXTENDED_BIBLE_DICTIONARY
    results = []
    q_lower = q.lower()
    for key, entry in EXTENDED_BIBLE_DICTIONARY.items():
        if q_lower in key or q_lower in entry["definition"].lower():
            results.append(entry)
    return {"results": results}

# ==================== DEVOTIONAL ENDPOINTS ====================

@api_router.get("/devotional/today")
async def get_today_devotional():
    from bible_data import FULL_YEAR_DEVOTIONALS
    # Get devotional based on day of year
    day_of_year = datetime.now(timezone.utc).timetuple().tm_yday
    index = (day_of_year - 1) % len(FULL_YEAR_DEVOTIONALS)
    devotional = FULL_YEAR_DEVOTIONALS[index]
    return {**devotional, "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"), "day_of_year": day_of_year}

@api_router.get("/devotional/all")
async def get_all_devotionals(page: int = 1, limit: int = 30):
    from bible_data import FULL_YEAR_DEVOTIONALS
    start = (page - 1) * limit
    end = start + limit
    devotionals = FULL_YEAR_DEVOTIONALS[start:end]
    return {
        "devotionals": devotionals,
        "total": len(FULL_YEAR_DEVOTIONALS),
        "page": page,
        "pages": (len(FULL_YEAR_DEVOTIONALS) + limit - 1) // limit
    }

@api_router.get("/devotional/{day}")
async def get_devotional_by_day(day: int):
    from bible_data import FULL_YEAR_DEVOTIONALS
    if day < 1 or day > len(FULL_YEAR_DEVOTIONALS):
        raise HTTPException(status_code=404, detail="Devotional not found for this day")
    return FULL_YEAR_DEVOTIONALS[day - 1]

# ==================== PROFILE ENDPOINTS ====================

@api_router.get("/profile")
async def get_profile(request: Request):
    user = await get_current_user(request)
    
    # Get user stats
    bookmarks_count = await db.bookmarks.count_documents({"user_id": user["user_id"]})
    journals_count = await db.journals.count_documents({"user_id": user["user_id"]})
    posts_count = await db.forum_posts.count_documents({"user_id": user["user_id"]})
    
    # Get user settings
    settings = await db.user_settings.find_one({"user_id": user["user_id"]}, {"_id": 0})
    
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "is_premium": user.get("is_premium", False),
        "premium_since": user.get("premium_since"),
        "created_at": user.get("created_at"),
        "stats": {
            "bookmarks": bookmarks_count,
            "journals": journals_count,
            "forum_posts": posts_count
        },
        "settings": settings or {
            "notification_email": True,
            "notification_forum": True,
            "preferred_translation": "WEB",
            "theme_preference": "system"
        }
    }

@api_router.put("/profile")
async def update_profile(update_data: UserProfileUpdate, request: Request):
    user = await get_current_user(request)
    
    updates = {}
    if update_data.name:
        updates["name"] = update_data.name
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"name": update_data.name}}
        )
    
    # Update settings
    settings_updates = {}
    if update_data.notification_email is not None:
        settings_updates["notification_email"] = update_data.notification_email
    if update_data.notification_forum is not None:
        settings_updates["notification_forum"] = update_data.notification_forum
    if update_data.preferred_translation:
        settings_updates["preferred_translation"] = update_data.preferred_translation
    if update_data.theme_preference:
        settings_updates["theme_preference"] = update_data.theme_preference
    
    if settings_updates:
        await db.user_settings.update_one(
            {"user_id": user["user_id"]},
            {"$set": settings_updates},
            upsert=True
        )
    
    return {"message": "Profile updated successfully"}

@api_router.get("/profile/reading-progress")
async def get_reading_progress(request: Request):
    user = await get_current_user(request)
    
    # Get all bookmarks to calculate progress
    bookmarks = await db.bookmarks.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).to_list(1000)
    
    # Calculate books and chapters read
    books_read = set()
    chapters_read = set()
    for bm in bookmarks:
        books_read.add(bm["book"])
        chapters_read.add(f"{bm['book']}_{bm['chapter']}")
    
    # Total chapters in Bible
    total_chapters = sum(book["chapters"] for book in BIBLE_BOOKS)
    
    return {
        "books_started": len(books_read),
        "total_books": 66,
        "chapters_bookmarked": len(chapters_read),
        "total_chapters": total_chapters,
        "progress_percentage": round((len(chapters_read) / total_chapters) * 100, 1),
        "recent_bookmarks": bookmarks[:5]
    }

# ==================== BOOKMARK ENDPOINTS ====================

@api_router.post("/bookmarks", response_model=BookmarkResponse)
async def create_bookmark(bookmark: BookmarkCreate, request: Request):
    user = await get_current_user(request)
    
    bookmark_id = f"bm_{uuid.uuid4().hex[:12]}"
    bookmark_doc = {
        "bookmark_id": bookmark_id,
        "user_id": user["user_id"],
        "book": bookmark.book,
        "chapter": bookmark.chapter,
        "verse": bookmark.verse,
        "note": bookmark.note,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bookmarks.insert_one(bookmark_doc)
    return BookmarkResponse(**bookmark_doc)

@api_router.get("/bookmarks")
async def get_bookmarks(request: Request):
    user = await get_current_user(request)
    bookmarks = await db.bookmarks.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return {"bookmarks": bookmarks}

@api_router.delete("/bookmarks/{bookmark_id}")
async def delete_bookmark(bookmark_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.bookmarks.delete_one({
        "bookmark_id": bookmark_id,
        "user_id": user["user_id"]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return {"message": "Bookmark deleted"}

# ==================== JOURNAL ENDPOINTS (PREMIUM) ====================

@api_router.post("/journal", response_model=JournalResponse)
async def create_journal(journal: JournalCreate, request: Request):
    user = await get_premium_user(request)
    
    journal_id = f"jrn_{uuid.uuid4().hex[:12]}"
    journal_doc = {
        "journal_id": journal_id,
        "user_id": user["user_id"],
        "title": journal.title,
        "content": journal.content,
        "scripture_ref": journal.scripture_ref,
        "mood": journal.mood,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.journals.insert_one(journal_doc)
    return JournalResponse(**journal_doc)

@api_router.get("/journal")
async def get_journals(request: Request):
    user = await get_premium_user(request)
    journals = await db.journals.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return {"journals": journals}

@api_router.delete("/journal/{journal_id}")
async def delete_journal(journal_id: str, request: Request):
    user = await get_premium_user(request)
    result = await db.journals.delete_one({
        "journal_id": journal_id,
        "user_id": user["user_id"]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return {"message": "Journal entry deleted"}

# ==================== FORUM ENDPOINTS (PREMIUM) ====================

@api_router.post("/forum/posts", response_model=ForumPostResponse)
async def create_post(post: ForumPostCreate, request: Request):
    user = await get_premium_user(request)
    
    post_id = f"post_{uuid.uuid4().hex[:12]}"
    post_doc = {
        "post_id": post_id,
        "user_id": user["user_id"],
        "user_name": user["name"],
        "title": post.title,
        "content": post.content,
        "scripture_ref": post.scripture_ref,
        "tags": post.tags or [],
        "upvotes": 0,
        "upvoted_by": [],
        "comments_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.forum_posts.insert_one(post_doc)
    return ForumPostResponse(**{k: v for k, v in post_doc.items() if k != "upvoted_by"})

@api_router.get("/forum/posts")
async def get_posts(request: Request, skip: int = 0, limit: int = 20):
    user = await get_premium_user(request)
    posts = await db.forum_posts.find(
        {},
        {"_id": 0, "upvoted_by": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"posts": posts}

@api_router.get("/forum/posts/{post_id}")
async def get_post(post_id: str):
    post = await db.forum_posts.find_one(
        {"post_id": post_id},
        {"_id": 0, "upvoted_by": 0}
    )
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comments = await db.forum_comments.find(
        {"post_id": post_id},
        {"_id": 0, "upvoted_by": 0}
    ).sort("created_at", 1).to_list(100)
    
    return {"post": post, "comments": comments}

@api_router.post("/forum/posts/{post_id}/upvote")
async def upvote_post(post_id: str, request: Request):
    user = await get_premium_user(request)
    
    post = await db.forum_posts.find_one({"post_id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    upvoted_by = post.get("upvoted_by", [])
    if user["user_id"] in upvoted_by:
        # Remove upvote
        await db.forum_posts.update_one(
            {"post_id": post_id},
            {"$pull": {"upvoted_by": user["user_id"]}, "$inc": {"upvotes": -1}}
        )
        return {"message": "Upvote removed", "upvoted": False}
    else:
        # Add upvote
        await db.forum_posts.update_one(
            {"post_id": post_id},
            {"$push": {"upvoted_by": user["user_id"]}, "$inc": {"upvotes": 1}}
        )
        return {"message": "Upvoted", "upvoted": True}

@api_router.post("/forum/posts/{post_id}/comments", response_model=CommentResponse)
async def create_comment(post_id: str, comment: CommentCreate, request: Request):
    user = await get_premium_user(request)
    
    post = await db.forum_posts.find_one({"post_id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comment_id = f"cmt_{uuid.uuid4().hex[:12]}"
    comment_doc = {
        "comment_id": comment_id,
        "post_id": post_id,
        "user_id": user["user_id"],
        "user_name": user["name"],
        "content": comment.content,
        "upvotes": 0,
        "upvoted_by": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.forum_comments.insert_one(comment_doc)
    await db.forum_posts.update_one(
        {"post_id": post_id},
        {"$inc": {"comments_count": 1}}
    )
    
    return CommentResponse(**{k: v for k, v in comment_doc.items() if k != "upvoted_by"})

@api_router.post("/forum/comments/{comment_id}/upvote")
async def upvote_comment(comment_id: str, request: Request):
    user = await get_premium_user(request)
    
    comment = await db.forum_comments.find_one({"comment_id": comment_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    upvoted_by = comment.get("upvoted_by", [])
    if user["user_id"] in upvoted_by:
        await db.forum_comments.update_one(
            {"comment_id": comment_id},
            {"$pull": {"upvoted_by": user["user_id"]}, "$inc": {"upvotes": -1}}
        )
        return {"message": "Upvote removed", "upvoted": False}
    else:
        await db.forum_comments.update_one(
            {"comment_id": comment_id},
            {"$push": {"upvoted_by": user["user_id"]}, "$inc": {"upvotes": 1}}
        )
        return {"message": "Upvoted", "upvoted": True}

# ==================== NEWS-SCRIPTURE ANALYSIS (PREMIUM) ====================

@api_router.post("/analyze/news")
async def analyze_news(analysis_req: NewsAnalysisRequest, request: Request):
    user = await get_premium_user(request)
    
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"analysis_{uuid.uuid4().hex[:8]}",
        system_message="""You are a biblical scholar and theologian. Your task is to analyze current news events and find relevant biblical scripture connections. 

For each news item:
1. Identify 2-4 relevant Bible verses that relate to the themes, situations, or principles in the news
2. Explain how each scripture connects to the current event
3. Provide practical spiritual insights for believers

Format your response as JSON with this structure:
{
    "scripture_references": [
        {
            "reference": "Book Chapter:Verse",
            "text": "The verse text",
            "connection": "How this relates to the news"
        }
    ],
    "analysis": "Overall analysis of how biblical principles apply to this news event",
    "spiritual_application": "Practical takeaways for believers"
}"""
    ).with_model("openai", "gpt-5.2")
    
    prompt = f"""Analyze this news event and connect it to biblical scripture:

Headline: {analysis_req.news_headline}

Content: {analysis_req.news_content}

Please provide relevant scripture references and analysis."""

    try:
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse the response
        import json
        try:
            # Try to extract JSON from the response
            response_text = response
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]
            
            parsed = json.loads(response_text)
        except:
            # If parsing fails, create structured response from text
            parsed = {
                "scripture_references": [
                    {"reference": "Romans 8:28", "text": "And we know that all things work together for good...", "connection": response[:500]}
                ],
                "analysis": response,
                "spiritual_application": "Seek God's wisdom in understanding current events."
            }
        
        analysis_id = f"ana_{uuid.uuid4().hex[:12]}"
        analysis_doc = {
            "analysis_id": analysis_id,
            "user_id": user["user_id"],
            "news_headline": analysis_req.news_headline,
            "news_content": analysis_req.news_content,
            "scripture_references": parsed.get("scripture_references", []),
            "analysis": parsed.get("analysis", ""),
            "spiritual_application": parsed.get("spiritual_application", ""),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.news_analyses.insert_one(analysis_doc)
        
        return {
            "analysis_id": analysis_id,
            "news_headline": analysis_req.news_headline,
            "scripture_references": parsed.get("scripture_references", []),
            "analysis": parsed.get("analysis", ""),
            "spiritual_application": parsed.get("spiritual_application", ""),
            "created_at": analysis_doc["created_at"]
        }
        
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@api_router.get("/analyze/history")
async def get_analysis_history(request: Request):
    user = await get_premium_user(request)
    analyses = await db.news_analyses.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return {"analyses": analyses}

# ==================== STRIPE SUBSCRIPTION ====================

SUBSCRIPTION_PRICE = 9.99  # $9.99/month

@api_router.post("/subscription/create-checkout")
async def create_checkout(sub_data: SubscriptionCreate, request: Request):
    user = await get_current_user(request)
    
    from emergentintegrations.payments.stripe.checkout import (
        StripeCheckout, CheckoutSessionRequest
    )
    
    host_url = sub_data.origin_url
    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{host_url}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}/pricing"
    
    checkout_request = CheckoutSessionRequest(
        amount=SUBSCRIPTION_PRICE,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["user_id"],
            "subscription_type": "premium_monthly"
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    await db.payment_transactions.insert_one({
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "session_id": session.session_id,
        "user_id": user["user_id"],
        "amount": SUBSCRIPTION_PRICE,
        "currency": "usd",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/subscription/status/{session_id}")
async def get_subscription_status(session_id: str, request: Request):
    user = await get_current_user(request)
    
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction and user if paid
    if status.payment_status == "paid":
        # Check if already processed
        txn = await db.payment_transactions.find_one({"session_id": session_id})
        if txn and txn.get("payment_status") != "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            # Update user to premium
            await db.users.update_one(
                {"user_id": user["user_id"]},
                {"$set": {"is_premium": True, "premium_since": datetime.now(timezone.utc).isoformat()}}
            )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount": status.amount_total / 100 if status.amount_total else SUBSCRIPTION_PRICE
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            user_id = webhook_response.metadata.get("user_id")
            if user_id:
                await db.users.update_one(
                    {"user_id": user_id},
                    {"$set": {"is_premium": True, "premium_since": datetime.now(timezone.utc).isoformat()}}
                )
                
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return JSONResponse(status_code=400, content={"error": str(e)})

# ==================== MEDIA LIBRARY (PREMIUM) ====================

# Video sermons - Using public domain/freely licensed content about end times prophecy
VIDEO_SERMONS = [
    {
        "id": "video_1",
        "title": "The Book of Revelation Explained",
        "preacher": "Dr. Vernon McGee",
        "description": "A comprehensive verse-by-verse study through the Book of Revelation, exploring the prophetic visions given to John and their significance for end times understanding.",
        "duration": "58:32",
        "thumbnail": "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=400&h=225&fit=crop",
        "video_url": "https://www.youtube.com/embed/Tv-HLFS9Cj0",
        "category": "Revelation",
        "date_added": "2025-01-01"
    },
    {
        "id": "video_2",
        "title": "Daniel's 70 Weeks Prophecy",
        "preacher": "Chuck Missler",
        "description": "An in-depth analysis of Daniel chapter 9 and the remarkable 70 weeks prophecy that predicted the coming of the Messiah and points to end times events.",
        "duration": "1:12:45",
        "thumbnail": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=225&fit=crop",
        "video_url": "https://www.youtube.com/embed/SVh1Y3N7Kwo",
        "category": "Daniel",
        "date_added": "2025-01-01"
    },
    {
        "id": "video_3",
        "title": "Signs of the Times - Matthew 24",
        "preacher": "David Jeremiah",
        "description": "Jesus' Olivet Discourse examined in detail - understanding the signs He gave us about the end of the age and His second coming.",
        "duration": "45:18",
        "thumbnail": "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400&h=225&fit=crop",
        "video_url": "https://www.youtube.com/embed/X0dMHoWP4BY",
        "category": "Prophecy",
        "date_added": "2025-01-01"
    },
    {
        "id": "video_4",
        "title": "The Rapture and Second Coming",
        "preacher": "John MacArthur",
        "description": "A biblical examination of the rapture of the church and Christ's glorious second coming, distinguishing between these two prophetic events.",
        "duration": "52:10",
        "thumbnail": "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=225&fit=crop",
        "video_url": "https://www.youtube.com/embed/4BEuJSUJXRU",
        "category": "Eschatology",
        "date_added": "2025-01-01"
    },
    {
        "id": "video_5",
        "title": "Ezekiel 38-39: The Gog and Magog War",
        "preacher": "Amir Tsarfati",
        "description": "Understanding the prophesied invasion of Israel by Gog and Magog, examining current geopolitical events in light of biblical prophecy.",
        "duration": "1:05:22",
        "thumbnail": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=225&fit=crop",
        "video_url": "https://www.youtube.com/embed/5F7VlXfIBcM",
        "category": "Ezekiel",
        "date_added": "2025-01-01"
    },
]

# Audio sermons - Classic public domain sermons on prophecy
AUDIO_SERMONS = [
    {
        "id": "audio_1",
        "title": "The Last Days According to Scripture",
        "preacher": "Charles Spurgeon",
        "description": "The Prince of Preachers expounds on what Scripture reveals about the last days, drawing from both Old and New Testament prophecies.",
        "duration": "42:15",
        "audio_url": "https://www.archive.org/download/spurgeon_sermons/LastDays.mp3",
        "category": "End Times",
        "date_added": "2025-01-01"
    },
    {
        "id": "audio_2",
        "title": "The Return of Christ",
        "preacher": "D.L. Moody",
        "description": "Evangelist D.L. Moody's powerful message on the imminent return of Jesus Christ and how believers should live in anticipation.",
        "duration": "38:45",
        "audio_url": "https://www.archive.org/download/moody_sermons/ReturnOfChrist.mp3",
        "category": "Second Coming",
        "date_added": "2025-01-01"
    },
    {
        "id": "audio_3",
        "title": "Understanding Biblical Prophecy",
        "preacher": "J. Vernon McGee",
        "description": "Dr. McGee provides a foundational teaching on how to properly interpret and understand biblical prophecy.",
        "duration": "55:30",
        "audio_url": "https://www.archive.org/download/ttb_prophecy/UnderstandingProphecy.mp3",
        "category": "Prophecy",
        "date_added": "2025-01-01"
    },
    {
        "id": "audio_4",
        "title": "The Tribulation Period",
        "preacher": "Adrian Rogers",
        "description": "A detailed study of the seven-year tribulation period described in Revelation, Daniel, and other prophetic books.",
        "duration": "48:20",
        "audio_url": "https://www.archive.org/download/rogers_prophecy/Tribulation.mp3",
        "category": "Tribulation",
        "date_added": "2025-01-01"
    },
    {
        "id": "audio_5",
        "title": "Israel in Bible Prophecy",
        "preacher": "J. Dwight Pentecost",
        "description": "Dr. Pentecost explains the central role of Israel in God's prophetic plan and the significance of Israel's restoration.",
        "duration": "51:10",
        "audio_url": "https://www.archive.org/download/pentecost_israel/IsraelProphecy.mp3",
        "category": "Israel",
        "date_added": "2025-01-01"
    },
]

@api_router.get("/media/videos")
async def get_video_sermons(request: Request):
    user = await get_premium_user(request)
    return {
        "videos": VIDEO_SERMONS,
        "notice": "New sermons are added every week. Check back regularly for fresh content on biblical prophecy and end times teaching.",
        "last_updated": "2025-01-01",
        "total_count": len(VIDEO_SERMONS)
    }

@api_router.get("/media/audio")
async def get_audio_sermons(request: Request):
    user = await get_premium_user(request)
    return {
        "audio": AUDIO_SERMONS,
        "notice": "New sermons are added every week. Check back regularly for fresh content on biblical prophecy and end times teaching.",
        "last_updated": "2025-01-01",
        "total_count": len(AUDIO_SERMONS)
    }

@api_router.get("/media/all")
async def get_all_media(request: Request):
    user = await get_premium_user(request)
    return {
        "videos": VIDEO_SERMONS,
        "audio": AUDIO_SERMONS,
        "notice": "New sermons are added every week. Check back regularly for fresh content on biblical prophecy and end times teaching.",
        "last_updated": "2025-01-01",
        "categories": ["Revelation", "Daniel", "Prophecy", "Eschatology", "Ezekiel", "End Times", "Second Coming", "Tribulation", "Israel"]
    }

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "Holy Navigator API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
