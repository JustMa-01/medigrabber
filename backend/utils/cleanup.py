import asyncio
import logging
from datetime import datetime, timedelta
from pathlib import Path
from supabase import create_client
from config import settings

logger = logging.getLogger(__name__)

async def cleanup_old_downloads():
    """Clean up old download files and records"""
    try:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        
        # Calculate cutoff date
        cutoff_date = datetime.now() - timedelta(days=settings.CLEANUP_AFTER_DAYS)
        
        # Get old download records
        response = supabase.table('download_records').select('*').lt('created_at', cutoff_date.isoformat()).execute()
        old_records = response.data
        
        cleaned_count = 0
        for record in old_records:
            try:
                # Delete file if it exists
                if record['file_path']:
                    file_path = settings.DOWNLOADS_DIR / record['file_path']
                    if file_path.exists():
                        file_path.unlink()
                        logger.info(f"Deleted file: {file_path}")
                
                # Delete database record
                supabase.table('download_records').delete().eq('id', record['id']).execute()
                cleaned_count += 1
                
            except Exception as e:
                logger.error(f"Error cleaning up record {record['id']}: {e}")
        
        logger.info(f"Cleanup completed. Removed {cleaned_count} old downloads.")
        
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")

if __name__ == "__main__":
    asyncio.run(cleanup_old_downloads())