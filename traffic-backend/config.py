"""
TrafficIQ Backend Configuration Module
Loads configuration from environment variables with sensible defaults.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Application configuration loaded from environment variables."""
    
    # Server Configuration
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5000))
    
    # CORS Configuration
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    
    # Model Configuration
    MODEL_FOLDER = os.getenv('MODEL_FOLDER', 'models')
    PREFERRED_MODEL = os.getenv('PREFERRED_MODEL', 'yolov8s.pt')
    
    # File Storage
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    PROCESSED_FOLDER = os.getenv('PROCESSED_FOLDER', 'static')
    
    # Traffic Signal Timing (seconds)
    BASE_SIGNAL_DURATION = int(os.getenv('BASE_SIGNAL_DURATION', 20))
    EMERGENCY_MIN_DURATION = int(os.getenv('EMERGENCY_MIN_DURATION', 45))
    
    # Vehicle Detection
    VEHICLE_CLASSES = [2, 3, 5, 7]  # COCO classes: car, motorcycle, bus, truck
    EMERGENCY_COLOR_THRESHOLD = 0.01  # 1% of image
    
    # MongoDB Configuration
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    MONGODB_DB_NAME = os.getenv('MONGODB_DB_NAME', 'trafficiq')
    
    @classmethod
    def get_model_path(cls, model_name: str) -> str:
        """Get full path to a model file."""
        return os.path.join(cls.MODEL_FOLDER, model_name)
    
    @classmethod
    def ensure_directories(cls):
        """Ensure all required directories exist."""
        os.makedirs(cls.UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(cls.PROCESSED_FOLDER, exist_ok=True)
        os.makedirs(cls.MODEL_FOLDER, exist_ok=True)


# Create config instance
config = Config()
