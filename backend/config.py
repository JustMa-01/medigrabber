import os
from pathlib import Path
from typing import Optional

class Settings:
    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # Downloads
    DOWNLOADS_DIR: Path = Path("downloads")
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "500"))
    CLEANUP_AFTER_DAYS: int = int(os.getenv("CLEANUP_AFTER_DAYS", "7"))
    
    # Instagram (optional)
    INSTAGRAM_USERNAME: Optional[str] = os.getenv("INSTAGRAM_USERNAME")
    INSTAGRAM_PASSWORD: Optional[str] = os.getenv("INSTAGRAM_PASSWORD")
    
    # Quality settings
    YOUTUBE_QUALITY_LIMITS = {
        'free': {
            'video': ['1080p', '720p', '480p'],
            'audio': ['128kbps']
        },
        'pro': {
            'video': ['4K', '1440p', '1080p', '720p', '480p'],
            'audio': ['320kbps', '256kbps', '128kbps']
        }
    }

settings = Settings()