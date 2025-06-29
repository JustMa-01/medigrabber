import re
from urllib.parse import urlparse
from typing import Optional

def validate_youtube_url(url: str) -> bool:
    """Validate YouTube URL format"""
    youtube_regex = re.compile(
        r'(https?://)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)/'
        r'(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?]{11})'
    )
    return bool(youtube_regex.match(url))

def validate_instagram_url(url: str) -> bool:
    """Validate Instagram URL format"""
    instagram_regex = re.compile(
        r'(https?://)?(www\.)?instagram\.com/(p|reel|stories)/[A-Za-z0-9_-]+/?'
    )
    return bool(instagram_regex.match(url))

def extract_youtube_video_id(url: str) -> Optional[str]:
    """Extract video ID from YouTube URL"""
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'(?:embed\/)([0-9A-Za-z_-]{11})',
        r'(?:v\/)([0-9A-Za-z_-]{11})',
        r'(?:youtu\.be\/)([0-9A-Za-z_-]{11})'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return None

def extract_instagram_shortcode(url: str) -> Optional[str]:
    """Extract shortcode from Instagram URL"""
    patterns = [
        r'instagram\.com/p/([A-Za-z0-9_-]+)',
        r'instagram\.com/reel/([A-Za-z0-9_-]+)',
        r'instagram\.com/stories/[^/]+/([A-Za-z0-9_-]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return None

def get_instagram_media_type(url: str) -> Optional[str]:
    """Determine Instagram media type from URL"""
    if '/p/' in url:
        return 'post'
    elif '/reel/' in url:
        return 'reel'
    elif '/stories/' in url:
        return 'story'
    return None