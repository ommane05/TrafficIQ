import React, { useEffect, useState, useCallback, memo } from "react";
import CountUp from "react-countup";
import {
  FaArrowUp,
  FaArrowDown,
  FaArrowLeft,
  FaArrowRight,
  FaClock,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCarAlt,
  FaChartLine,
  FaRoad
} from "react-icons/fa";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

// Constants
const LANES = ["north", "south", "east", "west"];

const LANE_CONFIG = {
  north: {
    gradient: "lane-north",
    icon: <FaArrowUp />,
    color: "cyan",
    label: "North"
  },
  south: {
    gradient: "lane-south",
    icon: <FaArrowDown />,
    color: "emerald",
    label: "South"
  },
  east: {
    gradient: "lane-east",
    icon: <FaArrowRight />,
    color: "violet",
    label: "East"
  },
  west: {
    gradient: "lane-west",
    icon: <FaArrowLeft />,
    color: "amber",
    label: "West"
  }
};

// Stats Summary Component
const StatsSummary = memo(({ trafficData }) => {
  const totalVehicles = Object.values(trafficData || {})
    .filter(d => d !== null && typeof d === 'object')
    .reduce((acc, d) => acc + (d?.vehicle_count || 0), 0);


  const avgDensity = totalVehicles / 4;
  const densityLevel = avgDensity < 15 ? "Low" : avgDensity < 30 ? "Medium" : "High";

  const stats = [
    {
      label: "Total Vehicles",
      value: totalVehicles,
      icon: <FaCarAlt />,
      color: "brand"
    },
    {
      label: "Active Lanes",
      value: 4,
      icon: <FaRoad />,
      color: "emerald"
    },
    {
      label: "Avg. Density",
      value: densityLevel,
      icon: <FaChartLine />,
      color: avgDensity < 15 ? "emerald" : avgDensity < 30 ? "amber" : "red",
      isText: true
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="stat-card animate-fade-in-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/50 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white">
                {stat.isText ? stat.value : (
                  <CountUp end={stat.value} duration={1} />
                )}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center`}>
              <span className={`text-${stat.color}-400 text-xl`}>{stat.icon}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

StatsSummary.displayName = "StatsSummary";

// Clock Component
const Clock = memo(() => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="glass-card px-4 py-2 flex items-center gap-4 text-sm">
      <div className="flex items-center gap-2 text-white/70">
        <FaClock className="text-brand-400" />
        <span className="font-mono font-medium">{time.toLocaleTimeString()}</span>
      </div>
      <div className="w-px h-4 bg-white/10" />
      <div className="flex items-center gap-2 text-white/70">
        <FaCalendarAlt className="text-brand-400" />
        <span className="font-mono">{time.toLocaleDateString()}</span>
      </div>
    </div>
  );
});

Clock.displayName = "Clock";

// Lane Card Component
const LaneCard = memo(({ direction, data, isGreenSignal }) => {
  const config = LANE_CONFIG[direction];
  if (!config) return null;

  const density = data.vehicle_count < 15 ? "Low" : data.vehicle_count < 30 ? "Medium" : "High";
  const densityPercent = Math.min((data.vehicle_count / 50) * 100, 100);
  const densityColor = data.vehicle_count < 15 ? "bg-emerald-500" : data.vehicle_count < 30 ? "bg-amber-500" : "bg-red-500";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl transition-all duration-300 ${config.gradient} ${isGreenSignal
        ? `ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/20`
        : "ring-1 ring-white/10"
        }`}
    >
      {/* Decorative elements */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
      <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white text-xl shadow-inner-glow`}>
              {config.icon}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">{config.label} Lane</h3>
              <p className="text-sm text-white/50">Direction {direction.toUpperCase()}</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm bg-white/10 text-white/70 border border-white/10">
            Normal
          </div>
        </div>

        {/* Vehicle Count */}
        <div className="text-center py-6">
          <p className="text-sm text-white/50 uppercase tracking-wider mb-2">Total Vehicles</p>
          <div className="flex items-center justify-center gap-3">
            <FaCarAlt className="text-2xl text-white/60" />
            <span className="text-5xl font-bold text-white">
              <CountUp end={data.vehicle_count} duration={0.5} />
            </span>
          </div>
        </div>

        {/* Signal Status */}
        <div className="flex items-center justify-center gap-3 py-4 bg-white/5 rounded-xl mb-4">
          <div className={`w-3 h-3 rounded-full ${isGreenSignal ? 'signal-green animate-pulse' : 'signal-red'}`} />
          <span className="text-sm font-medium text-white/80">
            {isGreenSignal ? "Green Signal Active" : "Waiting for Green"}
          </span>
        </div>

        {/* Density Bar */}
        <div data-tooltip-id={`density-tooltip-${direction}`} data-tooltip-content={`Traffic Density: ${density}`}>
          <div className="flex justify-between mb-2">
            <span className="text-xs text-white/50">Traffic Density</span>
            <span className="text-xs font-medium text-white">{density}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full ${densityColor} transition-all duration-700 ease-out`}
              style={{ width: `${densityPercent}%` }}
            />
          </div>
        </div>


        {/* Last Updated */}
        <div className="mt-4 pt-4 border-t border-white/10 text-center">
          <p className="text-xs text-white/40 flex items-center justify-center gap-1.5">
            <FaClock />
            Updated {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>

      <Tooltip id={`density-tooltip-${direction}`} />
    </div>
  );
});

LaneCard.displayName = "LaneCard";

// Legend Component
const TrafficLegend = memo(() => (
  <div className="glass-card p-4 mt-8">
    <p className="text-sm text-white/50 mb-3 font-medium">Traffic Density Legend</p>
    <div className="flex items-center justify-center flex-wrap gap-6">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-emerald-500" />
        <span className="text-sm text-white/70">Low (&lt;15)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-amber-500" />
        <span className="text-sm text-white/70">Medium (15-30)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <span className="text-sm text-white/70">High (&gt;30)</span>
      </div>
    </div>
  </div>
));

TrafficLegend.displayName = "TrafficLegend";

// Main Dashboard Component
const TrafficDashboard = ({ trafficData }) => {
  const [greenSignal, setGreenSignal] = useState("");

  const syncGreenSignal = useCallback(() => {
    const currentLaneIndex = parseInt(localStorage.getItem("currentLaneIndex"));

    if (!isNaN(currentLaneIndex) && currentLaneIndex >= 0 && currentLaneIndex < LANES.length) {
      setGreenSignal(LANES[currentLaneIndex]);
    } else {
      const activeLane = localStorage.getItem("activeSignal");
      if (activeLane && LANES.includes(activeLane)) {
        setGreenSignal(activeLane);
      } else if (trafficData && trafficData.green_signal) {
        setGreenSignal(trafficData.green_signal);
      }
    }
  }, [trafficData]);

  useEffect(() => {
    syncGreenSignal();
    const intervalId = setInterval(syncGreenSignal, 1000);

    const handleStorageChange = (e) => {
      if (e.key === "currentLaneIndex" || e.key === "activeSignal") {
        syncGreenSignal();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [syncGreenSignal]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-3">
            <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-pulse" />
            REAL-TIME MONITORING
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            Traffic Control Dashboard
          </h1>
          <p className="text-white/50">Monitor and manage traffic flow across all lanes</p>
        </div>
        <Clock />
      </div>

      {/* Stats Summary */}
      <StatsSummary trafficData={trafficData} />

      {/* Active Signal Banner */}
      {greenSignal && (
        <div className="glass-card p-4 flex items-center justify-center gap-3 animate-fade-in">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
          <span className="text-lg font-medium text-white">
            Active Signal: <span className="text-emerald-400 font-bold uppercase">{greenSignal}</span>
          </span>
        </div>
      )}

      {/* Lane Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {LANES.map((direction, index) => (
          <div key={direction} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
            <LaneCard
              direction={direction}
              data={trafficData[direction] || { vehicle_count: 0 }}
              isGreenSignal={greenSignal === direction}
            />
          </div>
        ))}
      </div>

      {/* Legend */}
      <TrafficLegend />
    </div>
  );
};

export default TrafficDashboard;