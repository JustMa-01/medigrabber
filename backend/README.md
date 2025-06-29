# MediaGrabber Backend

A FastAPI-based backend for downloading YouTube videos and Instagram content.

## Features

- **YouTube Downloads**: Support for video and audio downloads with quality selection
- **Instagram Downloads**: Support for posts, reels, and stories
- **User Management**: Integration with Supabase for user authentication and data storage
- **Subscription System**: Free and Pro tier support with quality restrictions
- **Background Processing**: Asynchronous download processing
- **File Management**: Automatic cleanup of old downloads

## Installation

1. **Clone the repository and navigate to backend directory**
```bash
cd backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

5. **Install system dependencies**

For Ubuntu/Debian:
```bash
sudo apt update
sudo apt install ffmpeg
```

For macOS:
```bash
brew install ffmpeg
```

For Windows:
- Download FFmpeg from https://ffmpeg.org/download.html
- Add to PATH

## Configuration

### Environment Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 8000)
- `DEBUG`: Debug mode (default: True)
- `MAX_FILE_SIZE_MB`: Maximum file size limit (default: 500MB)
- `CLEANUP_AFTER_DAYS`: Days to keep downloads (default: 7)

### Optional Instagram Configuration

For Instagram story downloads (requires user authentication):
- `INSTAGRAM_USERNAME`: Your Instagram username
- `INSTAGRAM_PASSWORD`: Your Instagram password

## Running the Server

### Development
```bash
python main.py
```

### Production
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### YouTube Downloads
- `POST /api/youtube/download` - Start YouTube download
- `GET /api/download/{download_id}/status` - Check download status
- `GET /api/download/{download_id}/file` - Download completed file

### Instagram Downloads
- `POST /api/instagram/download` - Start Instagram download

### User Management
- `GET /api/user/{user_id}/downloads` - Get user's download history
- `DELETE /api/download/{download_id}` - Delete download and file

### System
- `GET /health` - Health check
- `GET /` - API status

## Quality Restrictions

### Free Plan
- YouTube Video: Up to 1080p
- YouTube Audio: 128kbps
- Instagram: All content types

### Pro Plan
- YouTube Video: Up to 4K
- YouTube Audio: Up to 320kbps
- Instagram: All content types

## File Structure

```
backend/
├── main.py              # Main FastAPI application
├── config.py            # Configuration settings
├── requirements.txt     # Python dependencies
├── .env.example        # Environment variables template
├── utils/
│   ├── cleanup.py      # Cleanup utilities
│   └── validators.py   # URL validation utilities
├── downloads/          # Downloaded files directory
└── README.md          # This file
```

## Deployment

### Docker (Recommended)

1. **Create Dockerfile**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create downloads directory
RUN mkdir -p downloads

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

2. **Build and run**
```bash
docker build -t mediagrabber-backend .
docker run -p 8000:8000 --env-file .env mediagrabber-backend
```

### Manual Deployment

1. **Set up production environment**
2. **Install dependencies and configure environment**
3. **Use a process manager like PM2 or systemd**
4. **Set up reverse proxy with Nginx**
5. **Configure SSL certificates**

## Maintenance

### Cleanup Old Downloads
```bash
python utils/cleanup.py
```

### Monitor Logs
```bash
tail -f logs/app.log
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **CORS**: Configure proper CORS origins for production
3. **Rate Limiting**: Implement rate limiting for API endpoints
4. **File Validation**: Validate file types and sizes
5. **User Authentication**: Verify user permissions for all operations

## Troubleshooting

### Common Issues

1. **FFmpeg not found**: Install FFmpeg system-wide
2. **Permission errors**: Check file system permissions
3. **Download failures**: Check internet connection and URL validity
4. **Database errors**: Verify Supabase configuration

### Logs

Check application logs for detailed error information:
```bash
tail -f logs/app.log
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is for educational purposes only. Please respect copyright laws and terms of service of the platforms you're downloading from.