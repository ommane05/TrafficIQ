import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { FaHome, FaChartBar, FaTrafficLight, FaCloudUploadAlt, FaInfoCircle, FaWifi, FaExclamationTriangle, FaChartLine, FaHistory } from "react-icons/fa";
import FileUpload from "./components/FileUpload";
import TrafficDashboard from "./components/TrafficDashboard";
import SignalDisplay from "./components/SignalDisplay";
import TrafficData from "./components/TrafficData";
import About from "./components/About";
import HistoryPage from "./components/HistoryPage";
import TrendsChart from "./components/TrendsChart";
import { SOCKET_URL, SOCKET_OPTIONS } from "./config";

// Connection status enum
const ConnectionStatus = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  ERROR: 'error',
};

const App = () => {
  const location = useLocation();

  const getInitialTrafficState = () => ({
    north: { vehicle_count: 0, image_url: "" },
    east: { vehicle_count: 0, image_url: "" },
    south: { vehicle_count: 0, image_url: "" },
    west: { vehicle_count: 0, image_url: "" },
    green_signal: "",
  });

  // State management with localStorage persistence
  const [trafficData, setTrafficData] = useState(() => {
    const savedData = localStorage.getItem("trafficData");
    return savedData ? JSON.parse(savedData) : getInitialTrafficState();
  });

  const [activeLane, setActiveLane] = useState(() => {
    return localStorage.getItem("activeLane") || "";
  });

  const [timer, setTimer] = useState(() => {
    const savedTimer = localStorage.getItem("timer");
    return savedTimer ? parseInt(savedTimer, 10) : 0;
  });

  const [timerActive, setTimerActive] = useState(() => {
    const saved = localStorage.getItem("timerActive");
    return saved === "true";
  });

  // Connection status state
  const [connectionStatus, setConnectionStatus] = useState(ConnectionStatus.CONNECTING);
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, SOCKET_OPTIONS);

    newSocket.on("connect", () => {
      console.log("Connected to server");
      setConnectionStatus(ConnectionStatus.CONNECTED);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Disconnected:", reason);
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setConnectionStatus(ConnectionStatus.ERROR);
    });

    newSocket.on("reconnecting", () => {
      setConnectionStatus(ConnectionStatus.CONNECTING);
    });

    newSocket.on("traffic_update", (data) => {
      setTrafficData(data);
      localStorage.setItem("trafficData", JSON.stringify(data));
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Clear traffic data function
  const clearTrafficData = useCallback(() => {
    if (socket) {
      socket.emit("clear_data");
    }

    // Clear all state and storage
    setTrafficData(getInitialTrafficState());
    setActiveLane("");
    setTimer(0);
    setTimerActive(false);

    localStorage.clear();
    sessionStorage.clear();
  }, [socket]);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem("activeLane", activeLane);
    localStorage.setItem("timer", timer);
    localStorage.setItem("timerActive", timerActive);
  }, [activeLane, timer, timerActive]);

  // Connection status indicator component
  const ConnectionIndicator = () => {
    const statusConfig = {
      [ConnectionStatus.CONNECTED]: {
        color: "bg-emerald-500",
        text: "Connected",
        icon: <FaWifi />,
        pulse: true,
      },
      [ConnectionStatus.DISCONNECTED]: {
        color: "bg-red-500",
        text: "Disconnected",
        icon: <FaExclamationTriangle />,
        pulse: false,
      },
      [ConnectionStatus.CONNECTING]: {
        color: "bg-amber-500",
        text: "Connecting...",
        icon: <FaWifi />,
        pulse: true,
      },
      [ConnectionStatus.ERROR]: {
        color: "bg-red-500",
        text: "Connection Error",
        icon: <FaExclamationTriangle />,
        pulse: true,
      },
    };

    const config = statusConfig[connectionStatus];

    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
        ${connectionStatus === ConnectionStatus.CONNECTED ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
        <span className={`w-2 h-2 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`} />
        <span className="hidden sm:inline">{config.text}</span>
        {config.icon}
      </div>
    );
  };

  // Navigation items
  const navItems = [
    { path: "/", label: "Dashboard", icon: <FaHome /> },
    { path: "/traffic-data", label: "Traffic Data", icon: <FaChartBar /> },
    { path: "/trends", label: "Trends", icon: <FaChartLine /> },
    { path: "/history", label: "History", icon: <FaHistory /> },
    { path: "/signal-display", label: "Signals", icon: <FaTrafficLight /> },
    { path: "/upload", label: "Upload", icon: <FaCloudUploadAlt /> },
    { path: "/about", label: "About", icon: <FaInfoCircle /> },
  ];

  return (
    <div className="relative min-h-screen text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950" />

        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-float animate-delay-200" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-float animate-delay-300" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-4 mt-4">
          <nav className="glass-card px-6 py-4">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
              {/* Brand Logo */}
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:shadow-brand-500/50 transition-shadow">
                  <FaTrafficLight className="text-white text-lg" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gradient">TrafficIQ</h1>
                  <p className="text-xs text-white/50 -mt-0.5">Smart Traffic Management</p>
                </div>
              </Link>

              {/* Navigation Links */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-surface-800/50 rounded-xl p-1.5">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${location.pathname === item.path
                        ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                        }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span className="hidden sm:inline">{item.label}</span>
                    </Link>
                  ))}
                </div>

                {/* Connection Status */}
                <ConnectionIndicator />
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 pt-32 pb-8 px-4">
        <div className="max-w-7xl mx-auto animate-fade-in-up">
          <Routes>
            <Route path="/" element={<TrafficDashboard trafficData={trafficData} />} />
            <Route
              path="/traffic-data"
              element={<TrafficData trafficData={trafficData} clearTrafficData={clearTrafficData} />}
            />
            <Route path="/trends" element={<TrendsChart />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route
              path="/signal-display"
              element={
                <SignalDisplay
                  trafficData={trafficData}
                />
              }
            />
            <Route path="/upload" element={<FileUpload />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/40">
            <p>© 2025 TrafficIQ by Om Laxman Mane</p>
            <p className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${connectionStatus === ConnectionStatus.CONNECTED ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
              {connectionStatus === ConnectionStatus.CONNECTED ? 'System Online' : 'System Offline'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;