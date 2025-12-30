import React, { useEffect, useState, useRef } from "react";
import { FaAmbulance, FaClock, FaArrowUp, FaArrowDown, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { Tooltip } from "react-tooltip";

const LANE_ICONS = {
  North: <FaArrowUp />,
  South: <FaArrowDown />,
  East: <FaArrowRight />,
  West: <FaArrowLeft />
};

const LANE_COLORS = {
  North: { bg: "from-cyan-600 to-cyan-800", barClass: "bg-cyan-500" },
  South: { bg: "from-emerald-600 to-emerald-800", barClass: "bg-emerald-500" },
  East: { bg: "from-violet-600 to-violet-800", barClass: "bg-violet-500" },
  West: { bg: "from-amber-600 to-amber-800", barClass: "bg-amber-500" }
};

const SignalDisplay = ({ trafficData = {} }) => {
  const lanes = ["North", "East", "South", "West"];
  const [currentLaneIndex, setCurrentLaneIndex] = useState(0);
  const [signalDuration, setSignalDuration] = useState(30);
  const [timeLeft, setTimeLeft] = useState(30);
  const [currentTime, setCurrentTime] = useState(new Date());

  const intervalRef = useRef(null);
  const timerStartRef = useRef(Date.now());

  const getSignalTime = (laneKey, data = trafficData) => {
    const lane = data?.[laneKey];
    const vehicleCount = lane?.vehicle_count ?? 0;
    return vehicleCount >= 25 ? 45 : 30;
  };

  const switchToNextLane = () => {
    const nextIndex = (currentLaneIndex + 1) % lanes.length;
    const nextLaneKey = lanes[nextIndex].toLowerCase();
    const newDuration = getSignalTime(nextLaneKey);

    setCurrentLaneIndex(nextIndex);
    setSignalDuration(newDuration);
    setTimeLeft(newDuration);
    timerStartRef.current = Date.now();

    localStorage.setItem("currentLaneIndex", nextIndex.toString());
    localStorage.setItem("signalStartTime", Date.now().toString());
    localStorage.setItem("signalDuration", newDuration.toString());
  };

  // Initial hydration from localStorage
  useEffect(() => {
    const storedLaneIndex = parseInt(localStorage.getItem("currentLaneIndex"));
    const storedStartTime = parseInt(localStorage.getItem("signalStartTime"));
    const storedDuration = parseInt(localStorage.getItem("signalDuration"));

    if (!isNaN(storedLaneIndex) && !isNaN(storedStartTime) && !isNaN(storedDuration)) {
      const now = Date.now();
      const elapsed = Math.floor((now - storedStartTime) / 1000);
      const remaining = Math.max(storedDuration - elapsed, 0);

      setCurrentLaneIndex(storedLaneIndex);
      setSignalDuration(storedDuration);
      setTimeLeft(remaining);
      timerStartRef.current = storedStartTime;
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - timerStartRef.current) / 1000);
      const remaining = Math.max(signalDuration - elapsed, 0);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        switchToNextLane();
      }
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [signalDuration, currentLaneIndex]);

  // Update clock
  useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const nextLaneIndex = (currentLaneIndex + 1) % lanes.length;
  const progressPercent = ((signalDuration - timeLeft) / signalDuration) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            LIVE SIGNAL CONTROL
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            Traffic Signal Controller
          </h1>
          <p className="text-white/50">Real-time signal management with intelligent timing</p>
        </div>

        <div className="glass-card px-4 py-2 flex items-center gap-2">
          <FaClock className="text-brand-400" />
          <span className="font-mono text-white font-medium">{formatTime(currentTime)}</span>
        </div>
      </div>

      {/* Current Signal Status Banner */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* Traffic Light Visualization */}
            <div className="flex flex-col gap-2 p-3 bg-surface-900 rounded-xl">
              <div className={`w-6 h-6 rounded-full ${timeLeft > 5 ? 'bg-gray-700' : 'bg-gray-700'}`} />
              <div className={`w-6 h-6 rounded-full ${timeLeft <= 5 ? 'bg-amber-500 shadow-lg shadow-amber-500/50 animate-pulse' : 'bg-gray-700'}`} />
              <div className={`w-6 h-6 rounded-full ${timeLeft > 5 ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-gray-700'}`} />
            </div>

            <div>
              <p className="text-sm text-white/50 mb-1">Active Signal</p>
              <p className="text-2xl font-bold text-emerald-400">{lanes[currentLaneIndex]} Lane</p>
            </div>
          </div>

          {/* Timer Circle */}
          <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="42"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50" cy="50" r="42"
                stroke={timeLeft <= 10 ? "#f59e0b" : "#10b981"}
                strokeWidth="8"
                fill="none"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 * (progressPercent / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{timeLeft}</span>
              <span className="text-xs text-white/50">seconds</span>
            </div>
          </div>

          <div className="text-center md:text-right">
            <p className="text-sm text-white/50 mb-1">Next Up</p>
            <p className="text-xl font-semibold text-amber-400">{lanes[nextLaneIndex]} Lane</p>
          </div>
        </div>
      </div>

      {/* Lane Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {lanes.map((lane, index) => {
          const key = lane.toLowerCase();
          const laneData = trafficData?.[key] || { vehicle_count: 0 };
          const vehicleCount = laneData.vehicle_count ?? 0;
          const isGreen = currentLaneIndex === index;
          const isNextUp = index === nextLaneIndex && timeLeft <= 10;
          const barWidth = Math.min(vehicleCount, 50) * 2;
          const colors = LANE_COLORS[lane];

          return (
            <div
              key={lane}
              className={`relative overflow-hidden rounded-2xl backdrop-blur-sm transition-all duration-300 ${isGreen
                ? `bg-gradient-to-br ${colors.bg} ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/20`
                : isNextUp
                  ? `bg-gradient-to-br ${colors.bg} ring-2 ring-amber-400 shadow-lg shadow-amber-500/20`
                  : "bg-surface-800/80 ring-1 ring-white/10"
                }`}
              data-tooltip-id={`tooltip-${lane}`}
              data-tooltip-content={`${lane} Lane Signal Info`}
            >
              <Tooltip id={`tooltip-${lane}`} />

              {isGreen && (
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
              )}

              <div className="relative p-6">
                {/* Lane Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isGreen
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : isNextUp
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      : 'bg-white/10 text-white/60 border border-white/10'
                    }`}>
                    {isGreen ? '● ACTIVE' : isNextUp ? '◐ NEXT' : '○ WAITING'}
                  </span>
                </div>

                {/* Lane Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${isGreen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/60'
                    }`}>
                    {LANE_ICONS[lane]}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{lane} Lane</h3>
                    <p className="text-sm text-white/50">Direction {lane.toUpperCase()}</p>
                  </div>
                </div>

                {/* Vehicle Count */}
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-white/60">Vehicles Detected</span>
                    <span className="text-sm font-bold text-white">{vehicleCount}</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${isGreen ? 'bg-emerald-500' : colors.barClass}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>

                {/* Signal Lights */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <div className={`w-4 h-4 rounded-full ${isGreen ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'}`} />
                    <div className={`w-4 h-4 rounded-full ${isNextUp ? 'bg-amber-500 shadow-lg shadow-amber-500/50 animate-pulse' : 'bg-gray-700'}`} />
                    <div className="w-4 h-4 rounded-full bg-gray-700" />
                  </div>

                  {isGreen && (
                    <div className="text-sm font-mono text-emerald-400">
                      {timeLeft}s remaining
                    </div>
                  )}
                </div>

                {/* Get Ready Indicator */}
                {isNextUp && (
                  <div className="mt-4 p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl text-center">
                    <span className="text-sm font-medium text-amber-300 animate-pulse">
                      Get Ready - Signal changing soon!
                    </span>
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-center flex-wrap gap-6 text-sm text-white/60">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
            <span>Active Lane</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50" />
            <span>Next Lane</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
            <span>Waiting</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignalDisplay;