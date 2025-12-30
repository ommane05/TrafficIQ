import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaCloudUploadAlt, FaCheck, FaImage, FaArrowRight, FaRobot, FaBolt, FaClock, FaExclamationTriangle } from "react-icons/fa";
import { ENDPOINTS } from "../config";

const FileUpload = () => {
  const [files, setFiles] = useState({
    north: null,
    east: null,
    south: null,
    west: null,
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      Object.values(files).forEach((fileInfo) => {
        if (fileInfo?.previewUrl) {
          URL.revokeObjectURL(fileInfo.previewUrl);
        }
      });
    };
  }, []);

  const handleFileChange = useCallback((event, direction) => {
    const file = event.target.files[0];
    if (file) {
      setFiles((prev) => {
        // Revoke old URL if exists
        if (prev[direction]?.previewUrl) {
          URL.revokeObjectURL(prev[direction].previewUrl);
        }
        return {
          ...prev,
          [direction]: {
            file,
            previewUrl: URL.createObjectURL(file),
          },
        };
      });
      setError(null);
    }
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    setDragOver(false);

    for (const item of event.dataTransfer.items) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        const name = file.name.toLowerCase();
        const direction = ["north", "south", "east", "west"].find((dir) =>
          name.includes(dir)
        );
        if (direction) {
          setFiles((prev) => {
            // Revoke old URL if exists
            if (prev[direction]?.previewUrl) {
              URL.revokeObjectURL(prev[direction].previewUrl);
            }
            return {
              ...prev,
              [direction]: {
                file,
                previewUrl: URL.createObjectURL(file),
              },
            };
          });
        }
      }
    }
    setError(null);
  }, []);

  const allFilesUploaded = Object.values(files).every((f) => f?.file);
  const uploadedCount = Object.values(files).filter((f) => f?.file).length;

  const handleUpload = async () => {
    const formData = new FormData();
    for (const direction in files) {
      if (files[direction]?.file) {
        formData.append(direction, files[direction].file);
      }
    }

    try {
      setLoading(true);
      setError(null);

      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 150);

      // Add timeout for the request (60 seconds for YOLO processing)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(ENDPOINTS.UPLOAD, {
        method: "POST",
        body: formData,
        mode: "cors",
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      clearInterval(interval);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `Upload failed: ${response.status}`);
      }

      setUploadProgress(100);

      setTimeout(() => {
        setLoading(false);
        setUploadProgress(0);
        navigate("/signal-display");
      }, 500);

    } catch (error) {
      setLoading(false);
      setUploadProgress(0);
      console.error("Upload Error:", error);

      // Handle different error types
      if (error.name === 'AbortError') {
        setError("Upload timed out. The server may be processing the images. Please try again.");
      } else if (error.message === 'Failed to fetch') {
        setError("Cannot connect to server. Please ensure the backend is running on http://localhost:5000");
      } else {
        setError(error.message || "Failed to upload files. Please check if the server is running.");
      }
    }
  };

  // Direction configuration with explicit color classes (Tailwind-safe)
  const directionInfo = {
    north: { icon: "↑", label: "North", bgClass: "bg-cyan-500", ringClass: "ring-cyan-500/50", textClass: "text-cyan-400", bgLightClass: "bg-cyan-500/20" },
    east: { icon: "→", label: "East", bgClass: "bg-violet-500", ringClass: "ring-violet-500/50", textClass: "text-violet-400", bgLightClass: "bg-violet-500/20" },
    south: { icon: "↓", label: "South", bgClass: "bg-emerald-500", ringClass: "ring-emerald-500/50", textClass: "text-emerald-400", bgLightClass: "bg-emerald-500/20" },
    west: { icon: "←", label: "West", bgClass: "bg-amber-500", ringClass: "ring-amber-500/50", textClass: "text-amber-400", bgLightClass: "bg-amber-500/20" },
  };

  const directions = Object.keys(directionInfo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-3">
          <FaCloudUploadAlt />
          IMAGE UPLOAD
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
          Traffic Lane Analysis
        </h1>
        <p className="text-white/50 max-w-2xl mx-auto">
          Upload traffic lane images for AI-powered vehicle detection and signal timing optimization
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="glass-card p-4 bg-red-500/10 border-red-500/30 flex items-center gap-3">
          <FaExclamationTriangle className="text-red-400 text-xl flex-shrink-0" />
          <div>
            <p className="text-red-300 font-medium">Upload Failed</p>
            <p className="text-red-400/70 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-sm text-white/60">Upload Progress</span>
          <span className="text-sm font-bold text-brand-400">{uploadedCount}/4</span>
        </div>
        <div className="flex gap-2">
          {directions.map((dir) => {
            const info = directionInfo[dir];
            return (
              <div
                key={dir}
                className={`flex-1 h-2 rounded-full transition-all duration-300 ${files[dir]?.file ? info.bgClass : 'bg-white/10'
                  }`}
              />
            );
          })}
        </div>
      </div>

      {/* Main Upload Area */}
      <div
        className={`glass-card p-8 transition-all duration-300 ${dragOver ? "ring-2 ring-brand-500 bg-brand-500/5" : ""
          }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Direction Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {directions.map((direction) => {
            const info = directionInfo[direction];
            const hasFile = files[direction]?.file;

            return (
              <div
                key={direction}
                className={`relative group rounded-xl overflow-hidden transition-all duration-300 ${hasFile
                  ? `ring-2 ${info.ringClass} ${info.bgLightClass}`
                  : 'ring-1 ring-white/10 hover:ring-white/20'
                  }`}
              >
                <div className="p-4">
                  {/* Direction Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold ${hasFile
                        ? `${info.bgLightClass} ${info.textClass}`
                        : 'bg-white/10 text-white/60'
                        }`}>
                        {info.icon}
                      </div>
                      <span className="font-semibold text-white">{info.label}</span>
                    </div>
                    {hasFile && (
                      <div className={`w-6 h-6 rounded-full ${info.bgClass} flex items-center justify-center`}>
                        <FaCheck className="text-white text-xs" />
                      </div>
                    )}
                  </div>

                  {/* Image Preview or Upload Zone */}
                  {files[direction]?.previewUrl ? (
                    <div className="space-y-3">
                      <div className="relative rounded-lg overflow-hidden aspect-video">
                        <img
                          src={files[direction].previewUrl}
                          alt={`${direction} preview`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                          <span className="text-xs text-white truncate max-w-full">
                            {files[direction].file.name}
                          </span>
                        </div>
                      </div>
                      <label className="block cursor-pointer text-center text-sm font-medium py-2 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                        Change Image
                        <input
                          type="file"
                          onChange={(e) => handleFileChange(e, direction)}
                          className="hidden"
                          accept="image/*"
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className="upload-zone aspect-video flex flex-col items-center justify-center p-4 text-center">
                        <FaImage className="text-3xl text-white/30 mb-2" />
                        <p className="text-sm text-white/50">
                          Click or drag image
                        </p>
                      </div>
                      <input
                        type="file"
                        onChange={(e) => handleFileChange(e, direction)}
                        className="hidden"
                        accept="image/*"
                      />
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!allFilesUploaded || loading}
          className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-300 ${allFilesUploaded && !loading
            ? "btn-primary"
            : "bg-surface-700 text-white/50 cursor-not-allowed"
            }`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : allFilesUploaded ? (
            <>
              Analyze Traffic Patterns
              <FaArrowRight />
            </>
          ) : (
            `Upload All 4 Direction Images (${uploadedCount}/4)`
          )}
        </button>

        {/* Upload Progress Bar */}
        {uploadProgress > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/50 mb-2">
              <span>Uploading and analyzing...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center flex-shrink-0">
            <FaRobot className="text-brand-400 text-xl" />
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">AI Processing</h3>
            <p className="text-sm text-white/50">YOLOv8 vehicle detection with 95%+ accuracy</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <FaBolt className="text-emerald-400 text-xl" />
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">Real-time Updates</h3>
            <p className="text-sm text-white/50">Live traffic data via WebSocket connections</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <FaClock className="text-amber-400 text-xl" />
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">Smart Timing</h3>
            <p className="text-sm text-white/50">Optimized signal duration based on density</p>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="text-center text-sm text-white/40">
        <p>💡 Tip: Name files with "north", "east", "south", or "west" for automatic sorting when drag-dropping</p>
      </div>
    </div>
  );
};

export default FileUpload;