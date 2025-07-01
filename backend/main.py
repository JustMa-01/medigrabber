import os
import asyncio
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
from urllib.parse import urlparse, parse_qs

import uvicorn
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, HttpUrl
import yt_dlp
import instaloader
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="MediaGrabber API",
    description="Backend API for YouTube and Instagram media downloads",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
DOWNLOADS_DIR = Path("downloads")

# Create downloads directory
DOWNLOADS_DIR.mkdir(exist_ok=True)

# Initialize Supabase client
if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
else:
    logger.warning("Supabase credentials not found. Some features may not work.")
    supabase = None

# Pydantic models
class YouTubeDownloadRequest(BaseModel):
    url: HttpUrl
    media_type: str  # 'video' or 'audio'
    quality: str = 'standard'
    user_id: str

class InstagramDownloadRequest(BaseModel):
    url: HttpUrl
    media_type: str  # 'post', 'reel', 'story'
    user_id: str

class DownloadResponse(BaseModel):
    success: bool
    download_id: str
    filename: Optional[str] = None
    file_size: Optional[int] = None
    message: Optional[str] = None

# Helper functions
def get_user_subscription(user_id: str) -> Dict[str, Any]:
    """Get user's subscription details"""
    if not supabase:
        return {'plan_type': 'free'}
    
    try:
        response = supabase.table('subscriptions').select('*').eq('user_id', user_id).eq('status', 'active').single().execute()
        return response.data if response.data else {'plan_type': 'free'}
    except Exception as e:
        logger.error(f"Error fetching subscription: {e}")
        return {'plan_type': 'free'}

def create_download_record(user_id: str, platform: str, url: str, media_type: str, quality: str = 'standard') -> str:
    """Create a download record in the database"""
    if not supabase:
        return f"demo_{datetime.now().timestamp()}"
    
    try:
        response = supabase.table('download_records').insert({
            'user_id': user_id,
            'platform': platform,
            'url': str(url),
            'media_type': media_type,
            'quality': quality,
            'status': 'pending'
        }).execute()
        return response.data[0]['id']
    except Exception as e:
        logger.error(f"Error creating download record: {e}")
        raise HTTPException(status_code=500, detail="Failed to create download record")

def update_download_record(download_id: str, **kwargs):
    """Update download record with new information"""
    if not supabase:
        return
    
    try:
        supabase.table('download_records').update(kwargs).eq('id', download_id).execute()
    except Exception as e:
        logger.error(f"Error updating download record: {e}")

def get_youtube_video_id(url: str) -> str:
    """Extract video ID from YouTube URL"""
    parsed_url = urlparse(url)
    if parsed_url.hostname == 'youtu.be':
        return parsed_url.path[1:]
    if parsed_url.hostname in ('www.youtube.com', 'youtube.com'):
        if parsed_url.path == '/watch':
            return parse_qs(parsed_url.query)['v'][0]
        if parsed_url.path[:7] == '/embed/':
            return parsed_url.path.split('/')[2]
        if parsed_url.path[:3] == '/v/':
            return parsed_url.path.split('/')[2]
    return None

def get_quality_format(media_type: str, quality: str, is_pro: bool) -> str:
    """Get yt-dlp format string based on quality and subscription"""
    if media_type == 'video':
        if quality == '4K' and is_pro:
            return 'bestvideo[height<=2160]+bestaudio/best[height<=2160]'
        elif quality == '1440p':
            return 'bestvideo[height<=1440]+bestaudio/best[height<=1440]'
        elif quality == '1080p':
            return 'bestvideo[height<=1080]+bestaudio/best[height<=1080]'
        elif quality == '720p':
            return 'bestvideo[height<=720]+bestaudio/best[height<=720]'
        else:
            return 'bestvideo[height<=480]+bestaudio/best[height<=480]'
    else:  # audio
        if quality == '320kbps' and is_pro:
            return 'bestaudio[abr<=320]/bestaudio'
        elif quality == '256kbps' and is_pro:
            return 'bestaudio[abr<=256]/bestaudio'
        else:
            return 'bestaudio[abr<=128]/bestaudio'

async def download_youtube_video(request: YouTubeDownloadRequest, download_id: str):
    """Download YouTube video/audio using yt-dlp"""
    try:
        # Get user subscription
        subscription = get_user_subscription(request.user_id)
        is_pro = subscription.get('plan_type') == 'pro'
        
        # Check quality restrictions
        if not is_pro:
            if request.media_type == 'video' and request.quality in ['4K']:
                raise HTTPException(status_code=403, detail="4K quality requires Pro subscription")
            if request.media_type == 'audio' and request.quality in ['320kbps', '256kbps']:
                raise HTTPException(status_code=403, detail="High quality audio requires Pro subscription")
        
        # Create user-specific download directory
        user_dir = DOWNLOADS_DIR / request.user_id / download_id
        user_dir.mkdir(parents=True, exist_ok=True)
        
        # Configure yt-dlp options
        video_id = get_youtube_video_id(str(request.url))
        if not video_id:
            raise HTTPException(status_code=400, detail="Invalid YouTube URL")
        
        format_selector = get_quality_format(request.media_type, request.quality, is_pro)
        
        ydl_opts = {
            'format': format_selector,
            'outtmpl': str(user_dir / '%(title)s.%(ext)s'),
            'noplaylist': True,
            'extractaudio': request.media_type == 'audio',
            'audioformat': 'mp3' if request.media_type == 'audio' else None,
            'audioquality': '0' if is_pro else '5',  # 0 = best, 9 = worst
        }
        
        # Download the media
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Get video info first
            info = ydl.extract_info(str(request.url), download=False)
            title = info.get('title', 'Unknown')
            duration = info.get('duration', 0)
            
            # Download the video
            ydl.download([str(request.url)])
            
            # Find the downloaded file
            downloaded_files = list(user_dir.glob('*'))
            if not downloaded_files:
                raise Exception("No files were downloaded")
            
            downloaded_file = downloaded_files[0]
            file_size = downloaded_file.stat().st_size
            
            # Update download record
            update_download_record(
                download_id,
                status='completed',
                filename=downloaded_file.name,
                file_path=str(downloaded_file.relative_to(DOWNLOADS_DIR)),
                file_size=file_size
            )
            
            logger.info(f"Successfully downloaded: {downloaded_file.name}")
            
    except Exception as e:
        logger.error(f"YouTube download failed: {e}")
        update_download_record(
            download_id,
            status='failed',
            error_message=str(e)
        )
        raise

async def download_instagram_media(request: InstagramDownloadRequest, download_id: str):
    """Download Instagram media using instaloader"""
    try:
        # Create user-specific download directory
        user_dir = DOWNLOADS_DIR / request.user_id / download_id
        user_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize instaloader
        L = instaloader.Instaloader(
            download_videos=True,
            download_video_thumbnails=False,
            download_geotags=False,
            download_comments=False,
            save_metadata=False,
            dirname_pattern=str(user_dir)
        )
        
        # Extract shortcode from URL
        url_str = str(request.url)
        if '/p/' in url_str:
            shortcode = url_str.split('/p/')[1].split('/')[0]
        elif '/reel/' in url_str:
            shortcode = url_str.split('/reel/')[1].split('/')[0]
        elif '/stories/' in url_str:
            # Stories require authentication
            raise HTTPException(status_code=403, detail="Story downloads require Instagram authentication")
        else:
            raise HTTPException(status_code=400, detail="Invalid Instagram URL")
        
        # Download the post
        post = instaloader.Post.from_shortcode(L.context, shortcode)
        L.download_post(post, target=str(user_dir))
        
        # Find downloaded files
        downloaded_files = list(user_dir.glob('*'))
        if not downloaded_files:
            raise Exception("No files were downloaded")
        
        # Get the main media file (usually the largest)
        main_file = max(downloaded_files, key=lambda f: f.stat().st_size)
        file_size = main_file.stat().st_size
        
        # Update download record
        update_download_record(
            download_id,
            status='completed',
            filename=main_file.name,
            file_path=str(main_file.relative_to(DOWNLOADS_DIR)),
            file_size=file_size
        )
        
        logger.info(f"Successfully downloaded: {main_file.name}")
        
    except Exception as e:
        logger.error(f"Instagram download failed: {e}")
        update_download_record(
            download_id,
            status='failed',
            error_message=str(e)
        )
        raise

# API Routes
@app.get("/")
async def root():
    return {"message": "MediaGrabber API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/youtube/download", response_model=DownloadResponse)
async def download_youtube(request: YouTubeDownloadRequest, background_tasks: BackgroundTasks):
    """Download YouTube video or audio"""
    try:
        # Create download record
        download_id = create_download_record(
            request.user_id, 
            'YouTube', 
            str(request.url), 
            request.media_type,
            request.quality
        )
        
        # Start download in background
        background_tasks.add_task(download_youtube_video, request, download_id)
        
        return DownloadResponse(
            success=True,
            download_id=download_id,
            message="Download started"
        )
        
    except Exception as e:
        logger.error(f"YouTube download request failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/instagram/download", response_model=DownloadResponse)
async def download_instagram(request: InstagramDownloadRequest, background_tasks: BackgroundTasks):
    """Download Instagram post, reel, or story"""
    try:
        # Create download record
        download_id = create_download_record(
            request.user_id,
            'Instagram',
            str(request.url),
            request.media_type
        )
        
        # Start download in background
        background_tasks.add_task(download_instagram_media, request, download_id)
        
        return DownloadResponse(
            success=True,
            download_id=download_id,
            message="Download started"
        )
        
    except Exception as e:
        logger.error(f"Instagram download request failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/download/{download_id}/status")
async def get_download_status(download_id: str):
    """Get download status"""
    if not supabase:
        return {"status": "demo", "message": "Demo mode - no database connection"}
    
    try:
        response = supabase.table('download_records').select('*').eq('id', download_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Download not found")
        
        return response.data
        
    except Exception as e:
        logger.error(f"Error fetching download status: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch download status")

@app.get("/api/download/{download_id}/file")
async def download_file(download_id: str, user_id: str):
    """Download the actual file"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Service unavailable in demo mode")
    
    try:
        # Get download record
        response = supabase.table('download_records').select('*').eq('id', download_id).eq('user_id', user_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Download not found")
        
        record = response.data
        if record['status'] != 'completed':
            raise HTTPException(status_code=400, detail="Download not completed")
        
        file_path = DOWNLOADS_DIR / record['file_path']
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        return FileResponse(
            path=str(file_path),
            filename=record['filename'],
            media_type='application/octet-stream'
        )
        
    except Exception as e:
        logger.error(f"Error serving file: {e}")
        raise HTTPException(status_code=500, detail="Failed to serve file")

@app.get("/api/user/{user_id}/downloads")
async def get_user_downloads(user_id: str, limit: int = 50, offset: int = 0):
    """Get user's download history"""
    if not supabase:
        return []
    
    try:
        response = supabase.table('download_records').select('*').eq('user_id', user_id).order('created_at', desc=True).limit(limit).offset(offset).execute()
        return response.data
        
    except Exception as e:
        logger.error(f"Error fetching user downloads: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch downloads")

@app.delete("/api/download/{download_id}")
async def delete_download(download_id: str, user_id: str):
    """Delete a download and its files"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Service unavailable in demo mode")
    
    try:
        # Get download record
        response = supabase.table('download_records').select('*').eq('id', download_id).eq('user_id', user_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Download not found")
        
        record = response.data
        
        # Delete file if it exists
        if record['file_path']:
            file_path = DOWNLOADS_DIR / record['file_path']
            if file_path.exists():
                file_path.unlink()
            
            # Also try to remove the directory if it's empty
            try:
                file_path.parent.rmdir()
            except OSError:
                pass  # Directory not empty or doesn't exist
        
        # Delete database record
        supabase.table('download_records').delete().eq('id', download_id).execute()
        
        return {"message": "Download deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting download: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete download")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )