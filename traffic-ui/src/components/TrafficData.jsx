import React, { useEffect, useState } from "react";
import {
  FaArrowUp,
  FaArrowDown,
  FaArrowLeft,
  FaArrowRight,
  FaTrash,
  FaClock,
  FaExclamationTriangle
} from "react-icons/fa";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

const laneIcons = {
  north: <FaArrowUp />,
  south: <FaArrowDown />,
  east: <FaArrowRight />,
  west: <FaArrowLeft />,
};

// Explicit color classes for Tailwind (avoids dynamic class purging issues)
const laneColors = {
  north: {
    bg: "from-cyan-600 to-cyan-800",
    barGradient: "bg-gradient-to-r from-cyan-600 to-cyan-400"
  },
  south: {
    bg: "from-emerald-600 to-emerald-800",
    barGradient: "bg-gradient-to-r from-emerald-600 to-emerald-400"
  },
  east: {
    bg: "from-violet-600 to-violet-800",
    barGradient: "bg-gradient-to-r from-violet-600 to-violet-400"
  },
  west: {
    bg: "from-amber-600 to-amber-800",
    barGradient: "bg-gradient-to-r from-amber-600 to-amber-400"
  },
};

const TrafficData = ({ trafficData, clearTrafficData }) => {
  const [isDataCleared, setIsDataCleared] = useState(false);

  const maxVehicles = Math.max(
    ...Object.values(trafficData)
      .filter((d) => typeof d === "object")
      .map((d) => d.vehicle_count || 0),
    0 // Ensure we don't get -Infinity
  );

  useEffect(() => {
    if (isDataCleared) {
      localStorage.removeItem("trafficData");
      sessionStorage.removeItem("trafficData");
    }
  }, [isDataCleared]);

  const handleClearTrafficData = () => {
    setIsDataCleared(true);

    localStorage.removeItem("trafficData");
    localStorage.removeItem("currentLaneIndex");
    localStorage.removeItem("signalStartTime");
    localStorage.removeItem("signalDuration");
    localStorage.removeItem("storedTrafficData");
    localStorage.removeItem("keepDataCleared");
    sessionStorage.clear();

    clearTrafficData();
  };

  useEffect(() => {
    const keepDataCleared = localStorage.getItem("keepDataCleared");
    if (keepDataCleared === "true") {
      setIsDataCleared(true);
    }
  }, []);

  const formatTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const directions = Object.keys(trafficData).filter(d => d !== "green_signal" && d !== "last_updated");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-3">
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
            DATA VISUALIZATION
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            Traffic Monitoring Data
          </h1>
          <p className="text-white/50">Detailed view of vehicle counts and lane imagery</p>
        </div>

        {/* Clear Data Button */}
        <button
          onClick={handleClearTrafficData}
          className="btn-secondary flex items-center gap-2 text-red-400 hover:text-red-300 hover:border-red-500/30 hover:bg-red-500/10"
        >
          <FaTrash />
          Clear All Data
        </button>
      </div>

      {/* Lane Data Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {directions.map((direction) => {
          const data = trafficData[direction];
          if (!data || typeof data !== 'object') return null;

          const colors = laneColors[direction];
          if (!colors) return null;

          const isHighest = data.vehicle_count === maxVehicles && maxVehicles > 0;

          return (
            <div
              key={direction}
              data-tooltip-id={`tooltip-${direction}`}
              data-tooltip-content={`Traffic details for ${direction.toUpperCase()} lane`}
              className={`relative overflow-hidden rounded-2xl transition-all duration-300 ${isHighest
                ? "ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/10"
                : "ring-1 ring-white/10"
                }`}
            >
              <div className="glass-card-dark p-6">
                {/* Lane Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${colors.bg} shadow-lg`}>
                      <span className="text-white text-xl">{laneIcons[direction]}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white capitalize">{direction} Lane</h3>
                      <p className="text-sm text-white/50">Direction {direction.toUpperCase()}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ✓ Normal
                  </div>
                </div>

                {/* Traffic Image */}
                {data.image_url && (
                  <div className="relative mb-5 rounded-xl overflow-hidden shadow-lg ring-1 ring-white/10">
                    <img
                      src={`${data.image_url}?t=${new Date().getTime()}`}
                      alt={`${direction} traffic`}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <div className="flex items-center gap-2 text-xs text-white/70">
                        <FaClock />
                        Last capture: {formatTimestamp()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Vehicle Count */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-white/60">Total Vehicles</span>
                    <span className={`text-sm font-bold ${isHighest ? "text-amber-400" : "text-white"}`}>
                      {data.vehicle_count}
                    </span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${isHighest
                          ? "bg-gradient-to-r from-amber-600 to-amber-400"
                          : colors.barGradient
                        }`}
                      style={{
                        width: `${Math.min((data.vehicle_count / 50) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <Tooltip id={`tooltip-${direction}`} />
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-center flex-wrap gap-6 text-sm text-white/60">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-amber-600 to-amber-400" />
            <span>Highest Traffic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-brand-600 to-brand-400" />
            <span>Normal Traffic</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficData;