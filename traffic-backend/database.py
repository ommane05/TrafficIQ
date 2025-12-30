"""
TrafficIQ Database Module - MongoDB Integration
================================================
Handles all database operations including:
- Traffic record storage
- Image storage via GridFS
- Trends aggregation
- Historical data queries
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from bson import ObjectId

logger = logging.getLogger('TrafficIQ.Database')

# MongoDB connection - initialized on demand
_client = None
_db = None
_fs = None


def get_connection():
    """Get or create MongoDB connection."""
    global _client, _db, _fs
    
    if _client is None:
        try:
            from pymongo import MongoClient
            import gridfs
            
            mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
            db_name = os.getenv('MONGODB_DB_NAME', 'trafficiq')
            
            _client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
            # Test connection
            _client.admin.command('ping')
            
            _db = _client[db_name]
            _fs = gridfs.GridFS(_db)
            
            logger.info(f"Connected to MongoDB: {db_name}")
            
            # Create indexes
            _db.traffic_records.create_index([("created_at", -1)])
            _db.traffic_records.create_index([("direction", 1)])
            _db.traffic_records.create_index([("direction", 1), ("created_at", -1)])
            
        except Exception as e:
            logger.error(f"MongoDB connection failed: {e}")
            raise
    
    return _db, _fs


def save_traffic_record(
    direction: str,
    vehicle_count: int,
    original_image_path: str,
    processed_image_path: str
) -> Optional[str]:
    """
    Save a traffic record with images to MongoDB.
    
    Args:
        direction: Traffic direction (north, east, south, west)
        vehicle_count: Number of vehicles detected
        original_image_path: Path to original uploaded image
        processed_image_path: Path to processed image with annotations
    
    Returns:
        Record ID as string, or None if failed
    """
    try:
        db, fs = get_connection()
        
        # Store images in GridFS
        original_image_id = None
        processed_image_id = None
        
        if os.path.exists(original_image_path):
            with open(original_image_path, 'rb') as f:
                original_image_id = fs.put(
                    f.read(),
                    filename=os.path.basename(original_image_path),
                    content_type='image/jpeg',
                    direction=direction
                )
        
        if os.path.exists(processed_image_path):
            with open(processed_image_path, 'rb') as f:
                processed_image_id = fs.put(
                    f.read(),
                    filename=os.path.basename(processed_image_path),
                    content_type='image/jpeg',
                    direction=direction
                )
        
        # Create traffic record
        record = {
            'direction': direction,
            'vehicle_count': vehicle_count,
            'original_image_id': original_image_id,
            'processed_image_id': processed_image_id,
            'created_at': datetime.utcnow()
        }
        
        result = db.traffic_records.insert_one(record)
        logger.info(f"Saved traffic record: {direction} - {vehicle_count} vehicles")
        
        return str(result.inserted_id)
        
    except Exception as e:
        logger.error(f"Failed to save traffic record: {e}")
        return None


def get_image(image_id: str) -> Optional[bytes]:
    """Get image data from GridFS by ID."""
    try:
        db, fs = get_connection()
        grid_out = fs.get(ObjectId(image_id))
        return grid_out.read()
    except Exception as e:
        logger.error(f"Failed to get image {image_id}: {e}")
        return None


def get_history(
    direction: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Get paginated traffic history.
    
    Returns dict with 'records', 'total', 'page', 'pages'
    """
    try:
        db, fs = get_connection()
        
        # Build query
        query = {}
        if direction:
            query['direction'] = direction
        if start_date or end_date:
            query['created_at'] = {}
            if start_date:
                query['created_at']['$gte'] = start_date
            if end_date:
                query['created_at']['$lte'] = end_date
        
        # Count total
        total = db.traffic_records.count_documents(query)
        pages = (total + per_page - 1) // per_page
        
        # Get records
        skip = (page - 1) * per_page
        cursor = db.traffic_records.find(query).sort('created_at', -1).skip(skip).limit(per_page)
        
        records = []
        for doc in cursor:
            records.append({
                'id': str(doc['_id']),
                'direction': doc['direction'],
                'vehicle_count': doc['vehicle_count'],
                'original_image_id': str(doc.get('original_image_id', '')),
                'processed_image_id': str(doc.get('processed_image_id', '')),
                'created_at': doc['created_at'].isoformat()
            })
        
        return {
            'records': records,
            'total': total,
            'page': page,
            'pages': pages
        }
        
    except Exception as e:
        logger.error(f"Failed to get history: {e}")
        return {'records': [], 'total': 0, 'page': 1, 'pages': 0}


def get_trends(period: str = 'hourly', days: int = 7) -> List[Dict[str, Any]]:
    """
    Get traffic trends aggregated by hour or day.
    
    Args:
        period: 'hourly' or 'daily'
        days: Number of days to look back
    """
    try:
        db, fs = get_connection()
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Date grouping format
        if period == 'daily':
            date_format = '%Y-%m-%d'
            group_id = {
                'direction': '$direction',
                'date': {'$dateToString': {'format': date_format, 'date': '$created_at'}}
            }
        else:  # hourly
            date_format = '%Y-%m-%d %H:00'
            group_id = {
                'direction': '$direction',
                'date': {'$dateToString': {'format': '%Y-%m-%dT%H:00:00', 'date': '$created_at'}}
            }
        
        pipeline = [
            {'$match': {'created_at': {'$gte': start_date}}},
            {'$group': {
                '_id': group_id,
                'avg_count': {'$avg': '$vehicle_count'},
                'max_count': {'$max': '$vehicle_count'},
                'min_count': {'$min': '$vehicle_count'},
                'total_records': {'$sum': 1}
            }},
            {'$sort': {'_id.date': 1}}
        ]
        
        results = list(db.traffic_records.aggregate(pipeline))
        
        trends = []
        for doc in results:
            trends.append({
                'direction': doc['_id']['direction'],
                'period': doc['_id']['date'],
                'avg_count': round(doc['avg_count'], 1),
                'max_count': doc['max_count'],
                'min_count': doc['min_count'],
                'total_records': doc['total_records']
            })
        
        return trends
        
    except Exception as e:
        logger.error(f"Failed to get trends: {e}")
        return []


def get_stats() -> Dict[str, Any]:
    """Get summary statistics."""
    try:
        db, fs = get_connection()
        
        # Total records
        total_records = db.traffic_records.count_documents({})
        
        # Records today
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_records = db.traffic_records.count_documents({'created_at': {'$gte': today_start}})
        
        # Stats by direction
        pipeline = [
            {'$group': {
                '_id': '$direction',
                'total_vehicles': {'$sum': '$vehicle_count'},
                'avg_vehicles': {'$avg': '$vehicle_count'},
                'record_count': {'$sum': 1}
            }}
        ]
        direction_stats = {doc['_id']: {
            'total_vehicles': doc['total_vehicles'],
            'avg_vehicles': round(doc['avg_vehicles'], 1),
            'record_count': doc['record_count']
        } for doc in db.traffic_records.aggregate(pipeline)}
        
        # Peak hours (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        peak_pipeline = [
            {'$match': {'created_at': {'$gte': week_ago}}},
            {'$group': {
                '_id': {'$hour': '$created_at'},
                'avg_vehicles': {'$avg': '$vehicle_count'}
            }},
            {'$sort': {'avg_vehicles': -1}},
            {'$limit': 3}
        ]
        peak_hours = [doc['_id'] for doc in db.traffic_records.aggregate(peak_pipeline)]
        
        return {
            'total_records': total_records,
            'today_records': today_records,
            'by_direction': direction_stats,
            'peak_hours': peak_hours,
            'last_updated': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        return {
            'total_records': 0,
            'today_records': 0,
            'by_direction': {},
            'peak_hours': [],
            'last_updated': datetime.utcnow().isoformat()
        }


def check_connection() -> bool:
    """Check if MongoDB is connected and working."""
    try:
        db, fs = get_connection()
        return True
    except:
        return False
