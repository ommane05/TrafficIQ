# 🚦 TrafficIQ - AI-Powered Smart Traffic Management

An intelligent traffic monitoring system using **YOLOv8** for real-time vehicle detection and **MongoDB** for data persistence.

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![React](https://img.shields.io/badge/React-18+-61DAFB.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0+-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## ✨ Features

- 🚗 **Real-time Vehicle Detection** - YOLOv8 powered vehicle counting
- 🚦 **Smart Signal Control** - Dynamic timing based on traffic density
- 📊 **Traffic Trends** - Historical analytics and pattern visualization
- 📜 **History Dashboard** - Browse past traffic snapshots with images
- 🔄 **Real-time Updates** - WebSocket-powered live dashboard
- 🗄️ **MongoDB + GridFS** - Persistent storage for images and data

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js, Vite, Socket.IO |
| Backend | Flask, Python, Flask-SocketIO |
| AI/ML | YOLOv8 (Ultralytics), OpenCV |
| Database | MongoDB, GridFS |

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- MongoDB 7.0+

### Installation

```bash
# Clone the repo
git clone https://github.com/ommane05/TrafficIQ.git
cd TrafficIQ

# Backend setup
cd traffic-backend
pip install -r requirements.txt
cp .env.example .env

# Frontend setup
cd ../traffic-ui
npm install
```

### Configuration

Add to `traffic-backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=trafficiq
```

### Run

```bash
# Terminal 1: Backend
cd traffic-backend
python app.py

# Terminal 2: Frontend
cd traffic-ui
npm run dev
```

Open **http://localhost:5173** 🎉

## 📁 Project Structure

```
TrafficIQ/
├── traffic-backend/
│   ├── app.py          # Flask API + WebSocket
│   ├── database.py     # MongoDB/GridFS operations
│   ├── config.py       # Environment config
│   └── models/         # YOLOv8 model files
│
└── traffic-ui/
    └── src/
        ├── App.jsx
        └── components/
            ├── TrafficDashboard.jsx
            ├── HistoryPage.jsx
            ├── TrendsChart.jsx
            └── FileUpload.jsx
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload traffic images |
| GET | `/api/history` | Get traffic history |
| GET | `/api/trends` | Get traffic trends |
| GET | `/api/stats` | Get statistics |
| GET | `/api/image/:id` | Get image from GridFS |

## 📸 Screenshots

*Upload traffic images → AI detects vehicles → Dashboard updates in real-time*

## 📄 Documentation

See [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) for detailed documentation.

## 👤 Author

**Om Laxman Mane**

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
