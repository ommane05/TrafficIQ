"""
TrafficIQ Backend - AI-Powered Traffic Monitoring System
=========================================================
A production-ready Flask application with:
- YOLOv8 vehicle detection
- Real-time WebSocket updates
- Intelligent traffic signal timing
"""

import os
import uuid
import time
import logging
import threading
from datetime import datetime
from typing import Dict, Any, Optional, Tuple

import cv2
import numpy as np
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO

from config import config
import database as db

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

logging.basicConfig(
    level=logging.DEBUG if config.DEBUG else logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('TrafficIQ')

# Reduce noise from other libraries
logging.getLogger('werkzeug').setLevel(logging.WARNING)
logging.getLogger('engineio').setLevel(logging.WARNING)
logging.getLogger('socketio').setLevel(logging.WARNING)

# ============================================================================
# APPLICATION INITIALIZATION
# ============================================================================

app = Flask(__name__, static_folder=config.PROCESSED_FOLDER)

# CORS Configuration
if config.CORS_ORIGINS == ['*']:
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
else:
    CORS(app, resources={r"/*": {"origins": config.CORS_ORIGINS}}, supports_credentials=True)

# SocketIO with threading mode (best for Windows compatibility)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Ensure directories exist
config.ensure_directories()

# ============================================================================
# MODEL LOADING
# ============================================================================

model = None


def load_yolo_model():
    """Load YOLOv8 model with fallback options."""
    global model
    try:
        from ultralytics import YOLO
        
        # Try preferred model first, then fallback
        models_to_try = [
            config.get_model_path(config.PREFERRED_MODEL),
            config.get_model_path('yolov8s.pt'),
            config.get_model_path('yolov8n.pt'),
        ]
        
        for model_path in models_to_try:
            if os.path.exists(model_path):
                model = YOLO(model_path)
                logger.info(f"YOLO model loaded: {model_path}")
                return True
        
        logger.warning("No YOLO model found in models folder. Vehicle detection disabled.")
        return False
        
    except Exception as e:
        logger.error(f"Failed to load YOLO model: {e}")
        return False


# Load models at startup
load_yolo_model()

# ============================================================================
# TRAFFIC DATA MANAGEMENT
# ============================================================================

class TrafficState:
    """Thread-safe traffic state management."""
    
    def __init__(self):
        self._lock = threading.Lock()
        self._data = {
            "north": {"vehicle_count": 0, "image_url": ""},
            "east": {"vehicle_count": 0, "image_url": ""},
            "south": {"vehicle_count": 0, "image_url": ""},
            "west": {"vehicle_count": 0, "image_url": ""},
            "green_signal": "north",
            "last_updated": None
        }
    
    def get(self) -> Dict[str, Any]:
        """Get current traffic state."""
        with self._lock:
            return self._data.copy()
    
    def update_lane(self, direction: str, vehicle_count: int, image_url: str):
        """Update a specific lane's data."""
        with self._lock:
            self._data[direction] = {
                "vehicle_count": vehicle_count,
                "image_url": image_url
            }
            self._data["last_updated"] = datetime.now().isoformat()
    
    def set_green_signal(self, lane: str):
        """Set the green signal lane."""
        with self._lock:
            self._data["green_signal"] = lane
    
    def reset(self):
        """Reset all traffic data."""
        with self._lock:
            for lane in ["north", "east", "south", "west"]:
                self._data[lane] = {"vehicle_count": 0, "image_url": ""}
            self._data["green_signal"] = ""
            self._data["last_updated"] = datetime.now().isoformat()


traffic_state = TrafficState()

# ============================================================================
# VEHICLE DETECTION
# ============================================================================

def detect_vehicles(image_path: str) -> Tuple[str, int]:
    """
    Detect vehicles in an image using YOLO.
    
    Returns:
        Tuple of (processed_image_path, vehicle_count)
    
    Raises:
        ValueError: If model is not loaded or image processing fails
    """
    if model is None:
        raise ValueError("YOLO model not loaded. Please ensure model files are in the models folder.")
    
    try:
        # Run YOLO detection
        results = model(image_path, verbose=False)
        
        # Filter for vehicle classes only
        boxes = []
        if results and len(results) > 0 and results[0].boxes:
            all_boxes = results[0].boxes.data.cpu().numpy()
            # Filter by vehicle classes (car, motorcycle, bus, truck)
            boxes = [box for box in all_boxes if int(box[5]) in config.VEHICLE_CLASSES]
        
        vehicle_count = len(boxes)
        
        # Draw bounding boxes on image
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Failed to load image: {image_path}")
        
        for box in boxes:
            x1, y1, x2, y2, conf, cls = box[:6]
            x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])
            
            # Color based on confidence
            color = (0, 255, 0) if conf > 0.7 else (0, 255, 255)
            cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)
            
            # Add label
            label = f"Vehicle {conf:.0%}"
            cv2.putText(image, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        
        # Save processed image
        processed_path = os.path.join(config.PROCESSED_FOLDER, os.path.basename(image_path))
        cv2.imwrite(processed_path, image)
        
        logger.info(f"Detected {vehicle_count} vehicles in {os.path.basename(image_path)}")
        return processed_path, vehicle_count
        
    except Exception as e:
        logger.error(f"Vehicle detection error: {e}")
        raise


# ============================================================================
# API ROUTES
# ============================================================================

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint for monitoring and load balancers."""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
        "components": {
            "yolo_model": "loaded" if model is not None else "not_loaded"
        }
    }), 200


@app.route("/", methods=["GET"])
def index():
    """API root endpoint."""
    return jsonify({
        "name": "TrafficIQ API",
        "version": "2.0.0",
        "endpoints": {
            "health": "/health",
            "upload": "/upload (POST)",
            "traffic_data": "/process_traffic (GET)",
            "static_files": "/static/<filename>"
        }
    }), 200


@app.route("/upload", methods=["POST"])
def upload_files():
    """
    Handle traffic image uploads for all directions.
    
    Expects multipart/form-data with files named by direction (north, east, south, west).
    """
    if not request.files:
        return jsonify({
            "success": False,
            "error": "No files uploaded",
            "message": "Please upload images for traffic directions"
        }), 400
    
    if model is None:
        return jsonify({
            "success": False,
            "error": "Model not available",
            "message": "YOLO model not loaded. Please ensure model files exist in the models folder."
        }), 503
    
    try:
        results = {}
        files = request.files.to_dict()
        
        for direction, file in files.items():
            if direction not in ["north", "east", "south", "west"]:
                logger.warning(f"Ignoring unknown direction: {direction}")
                continue
                
            if file.filename == "":
                return jsonify({
                    "success": False,
                    "error": f"Empty file for {direction}",
                    "message": f"No file selected for {direction} direction"
                }), 400
            
            # Save with unique filename
            ext = os.path.splitext(file.filename)[1] or '.jpg'
            unique_filename = f"{direction}_{uuid.uuid4().hex}{ext}"
            filepath = os.path.join(config.UPLOAD_FOLDER, unique_filename)
            file.save(filepath)
            
            # Process image
            processed_path, vehicle_count = detect_vehicles(filepath)
            
            # Build image URL
            host_url = request.host_url.rstrip('/')
            image_url = f"{host_url}/static/{os.path.basename(processed_path)}"
            
            # Update state
            traffic_state.update_lane(direction, vehicle_count, image_url)
            
            # Save to database
            try:
                db.save_traffic_record(direction, vehicle_count, filepath, processed_path)
            except Exception as db_err:
                logger.warning(f"Database save failed (non-critical): {db_err}")
            
            results[direction] = {
                "vehicle_count": vehicle_count,
                "image_url": image_url
            }
        
        # Emit real-time update
        current_state = traffic_state.get()
        socketio.emit("traffic_update", current_state)
        
        logger.info(f"Processed {len(results)} direction(s) successfully")
        
        return jsonify({
            "success": True,
            "message": "Files uploaded and processed successfully",
            "data": current_state
        }), 200
        
    except ValueError as e:
        return jsonify({
            "success": False,
            "error": "Processing error",
            "message": str(e)
        }), 422
        
    except Exception as e:
        logger.exception("Upload processing failed")
        return jsonify({
            "success": False,
            "error": "Server error",
            "message": "An unexpected error occurred during processing"
        }), 500


@app.route("/process_traffic", methods=["GET"])
def get_traffic_data():
    """Get the current traffic state for all directions."""
    return jsonify(traffic_state.get()), 200


@app.route("/static/<path:filename>")
def serve_static(filename):
    """Serve processed images from the static folder."""
    return send_from_directory(config.PROCESSED_FOLDER, filename)


# ============================================================================
# DATABASE API ENDPOINTS
# ============================================================================

@app.route("/api/history", methods=["GET"])
def get_history():
    """Get paginated traffic history from database."""
    try:
        direction = request.args.get('direction')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        result = db.get_history(direction=direction, page=page, per_page=per_page)
        return jsonify({"success": True, **result}), 200
    except Exception as e:
        logger.error(f"History API error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/trends", methods=["GET"])
def get_trends():
    """Get traffic trends (hourly/daily aggregates)."""
    try:
        period = request.args.get('period', 'hourly')
        days = int(request.args.get('days', 7))
        
        trends = db.get_trends(period=period, days=days)
        return jsonify({"success": True, "trends": trends}), 200
    except Exception as e:
        logger.error(f"Trends API error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/stats", methods=["GET"])
def get_stats():
    """Get traffic statistics summary."""
    try:
        stats = db.get_stats()
        return jsonify({"success": True, "stats": stats}), 200
    except Exception as e:
        logger.error(f"Stats API error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/image/<image_id>")
def get_db_image(image_id):
    """Get image from GridFS by ID."""
    try:
        from flask import Response
        image_data = db.get_image(image_id)
        if image_data:
            return Response(image_data, mimetype='image/jpeg')
        return jsonify({"error": "Image not found"}), 404
    except Exception as e:
        logger.error(f"Image API error: {e}")
        return jsonify({"error": str(e)}), 500

# ============================================================================
# WEBSOCKET EVENTS
# ============================================================================

@socketio.on("connect")
def handle_connect():
    """Handle new WebSocket connections."""
    logger.info("Client connected")
    socketio.emit("traffic_update", traffic_state.get())


@socketio.on("disconnect")
def handle_disconnect():
    """Handle WebSocket disconnections."""
    logger.info("Client disconnected")


@socketio.on("clear_data")
def handle_clear_data():
    """Handle request to clear all traffic data."""
    traffic_state.reset()
    socketio.emit("traffic_update", traffic_state.get())
    logger.info("Traffic data cleared by client request")


@socketio.on("request_update")
def handle_request_update():
    """Handle request for current traffic state."""
    socketio.emit("traffic_update", traffic_state.get())

# ============================================================================
# TRAFFIC SIGNAL CONTROLLER
# ============================================================================

class TrafficSignalController:
    """Intelligent traffic signal timing controller."""
    
    def __init__(self):
        self.sequence = ["north", "east", "south", "west"]
        self.wait_times = {lane: 0 for lane in self.sequence}
        self.running = False
        self._thread = None
    
    def calculate_signal_duration(self, lane: str, data: Dict) -> int:
        """Calculate green signal duration based on traffic conditions."""
        lane_data = data.get(lane, {})
        vehicle_count = lane_data.get("vehicle_count", 0)
        
        # Scale duration based on vehicle count (capped at 3x base)
        vehicle_factor = min(vehicle_count / 5, 3.0)
        return int(config.BASE_SIGNAL_DURATION * max(1, vehicle_factor))
    
    def select_next_lane(self) -> str:
        """Select the next lane based on vehicle count and wait time."""
        data = traffic_state.get()
        max_score = -1
        selected_lane = self.sequence[0]
        
        for lane in self.sequence:
            lane_data = data.get(lane, {})
            vehicle_count = lane_data.get("vehicle_count", 0)
            
            # Score: vehicles * wait_time
            self.wait_times[lane] += 1
            score = vehicle_count * self.wait_times[lane]
            
            if score > max_score:
                max_score = score
                selected_lane = lane
        
        # Reset wait time for selected lane
        self.wait_times[selected_lane] = 0
        return selected_lane
    
    def run(self):
        """Main signal control loop."""
        logger.info("Traffic signal controller started")
        
        while self.running:
            try:
                # Select next lane
                lane = self.select_next_lane()
                data = traffic_state.get()
                
                # Calculate duration
                duration = self.calculate_signal_duration(lane, data)
                
                # Update state
                traffic_state.set_green_signal(lane)
                socketio.emit("traffic_update", traffic_state.get())
                
                lane_data = data.get(lane, {})
                logger.info(f"Green signal: {lane} ({duration}s)")
                
                # Wait for signal duration
                for _ in range(duration):
                    if not self.running:
                        break
                    time.sleep(1)
                    
            except Exception as e:
                logger.error(f"Signal controller error: {e}")
                time.sleep(5)
        
        logger.info("Traffic signal controller stopped")
    
    def start(self):
        """Start the signal controller in a background thread."""
        if self.running:
            return
        
        self.running = True
        self._thread = threading.Thread(target=self.run, daemon=True)
        self._thread.start()
    
    def stop(self):
        """Stop the signal controller."""
        self.running = False
        if self._thread:
            self._thread.join(timeout=5)


# Initialize and start signal controller
signal_controller = TrafficSignalController()
signal_controller.start()

# ============================================================================
# APPLICATION ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("TrafficIQ Backend Starting")
    logger.info("=" * 60)
    logger.info(f"Debug Mode: {config.DEBUG}")
    logger.info(f"Host: {config.HOST}:{config.PORT}")
    logger.info(f"YOLO Model: {'Loaded' if model else 'Not Available'}")
    logger.info("=" * 60)
    
    try:
        socketio.run(
            app,
            debug=config.DEBUG,
            host=config.HOST,
            port=config.PORT,
            use_reloader=config.DEBUG
        )
    finally:
        signal_controller.stop()