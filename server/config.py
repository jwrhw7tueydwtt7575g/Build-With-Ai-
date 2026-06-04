"""
Configuration module for FastAPI File Uploader
"""
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

class Settings:
    """Application settings"""
    
    # API Configuration
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", 8000))
    API_RELOAD: bool = os.getenv("API_RELOAD", "True").lower() == "true"
    
    # Azure Blob Storage Configuration
    AZURE_STORAGE_CONNECTION_STRING: str = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "")
    AZURE_BLOB_CONTAINER_NAME: str = os.getenv("AZURE_BLOB_CONTAINER_NAME", "uploads")
    
    # File Upload Configuration
    MAX_FILE_SIZE_MB: int = 100  # 100 MB
    MAX_FILE_SIZE: int = MAX_FILE_SIZE_MB * 1024 * 1024
    
    # Allowed file extensions
    ALLOWED_EXTENSIONS: set = {
        # Structured formats
        "csv", "xlsx", "json", "xml", "xls",
        # Unstructured formats
        "pdf", "doc", "docx", "txt",
        "jpg", "jpeg", "png", "gif", "bmp",
        "mp3", "wav", "m4a", "ogg",
    }


settings = Settings()
