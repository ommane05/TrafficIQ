import React, { useState, useEffect } from 'react';
import { FaChartLine, FaClock, FaCalendarAlt, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { API_URL } from '../config';

const TrendsChart = () => {
    const [trends, setTrends] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('hourly');
    const [days, setDays] = useState(7);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [trendsRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/api/trends?period=${period}&days=${days}`),
                fetch(`${API_URL}/api/stats`)
            ]);

            const trendsData = await trendsRes.json();
            const statsData = await statsRes.json();

            if (trendsData.success) setTrends(trendsData.trends);
            if (statsData.success) setStats(statsData.stats);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [period, days]);

    const getDirectionColor = (dir) => {
        const colors = {
            north: '#3B82F6',
            east: '#10B981',
            south: '#F59E0B',
            west: '#8B5CF6'
        };
        return colors[dir] || '#6B7280';
    };

    // Group trends by period for chart display
    const groupedTrends = trends.reduce((acc, t) => {
        if (!acc[t.period]) acc[t.period] = {};
        acc[t.period][t.direction] = t.avg_count;
        return acc;
    }, {});

    const chartData = Object.entries(groupedTrends).map(([period, directions]) => ({
        period: period.split('T')[1] || period.split(' ')[0],
        ...directions
    }));

    // Calculate max for scaling bars
    const maxValue = Math.max(...trends.map(t => t.avg_count), 1);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="glass-card p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                            <FaChartLine className="text-white text-xl" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Traffic Trends</h1>
                            <p className="text-white/60 text-sm">Analyze traffic patterns over time</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-3">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="bg-surface-800 text-white rounded-lg px-4 py-2 border border-white/10 focus:border-brand-500 focus:outline-none"
                        >
                            <option value="hourly">Hourly</option>
                            <option value="daily">Daily</option>
                        </select>
                        <select
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                            className="bg-surface-800 text-white rounded-lg px-4 py-2 border border-white/10 focus:border-brand-500 focus:outline-none"
                        >
                            <option value={1}>Last 24h</option>
                            <option value={7}>Last 7 days</option>
                            <option value={30}>Last 30 days</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass-card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-brand-500/20 flex items-center justify-center">
                                <FaChartLine className="text-brand-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.total_records}</p>
                                <p className="text-white/50 text-xs">Total Records</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                <FaCalendarAlt className="text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.today_records}</p>
                                <p className="text-white/50 text-xs">Today</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                <FaClock className="text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">
                                    {stats.peak_hours?.length > 0 ? `${stats.peak_hours[0]}:00` : 'N/A'}
                                </p>
                                <p className="text-white/50 text-xs">Peak Hour</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                                <FaArrowUp className="text-violet-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">
                                    {Object.values(stats.by_direction || {}).reduce((sum, d) => sum + d.total_vehicles, 0)}
                                </p>
                                <p className="text-white/50 text-xs">Total Vehicles</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            {loading ? (
                <div className="glass-card p-12 text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-white/60">Loading trends...</p>
                </div>
            ) : error ? (
                <div className="glass-card p-12 text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button onClick={fetchData} className="btn-primary">Retry</button>
                </div>
            ) : trends.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <FaChartLine className="text-6xl text-white/20 mx-auto mb-4" />
                    <p className="text-white/60">No trend data available yet</p>
                    <p className="text-white/40 text-sm mt-2">Upload traffic images to generate trends</p>
                </div>
            ) : (
                <>
                    {/* Simple Bar Chart */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Traffic Volume Over Time</h2>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-4 mb-6">
                            {['north', 'east', 'south', 'west'].map(dir => (
                                <div key={dir} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getDirectionColor(dir) }} />
                                    <span className="text-white/70 text-sm capitalize">{dir}</span>
                                </div>
                            ))}
                        </div>

                        {/* Chart */}
                        <div className="overflow-x-auto">
                            <div className="min-w-[600px]">
                                <div className="flex items-end justify-around gap-2 h-64">
                                    {chartData.slice(-20).map((data, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                            <div className="flex items-end gap-0.5 h-48">
                                                {['north', 'east', 'south', 'west'].map(dir => {
                                                    const value = data[dir] || 0;
                                                    const height = (value / maxValue) * 100;
                                                    return (
                                                        <div
                                                            key={dir}
                                                            className="w-3 rounded-t transition-all hover:opacity-80"
                                                            style={{
                                                                height: `${Math.max(height, 2)}%`,
                                                                backgroundColor: getDirectionColor(dir)
                                                            }}
                                                            title={`${dir}: ${value.toFixed(1)} avg vehicles`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                            <p className="text-white/40 text-xs text-center truncate w-full">{data.period}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Direction Stats */}
                    {stats?.by_direction && Object.keys(stats.by_direction).length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {['north', 'east', 'south', 'west'].map(dir => {
                                const dirStats = stats.by_direction[dir];
                                if (!dirStats) return null;
                                return (
                                    <div key={dir} className="glass-card p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: getDirectionColor(dir) }}
                                            />
                                            <h3 className="text-white font-semibold capitalize">{dir}</h3>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-white/50">Total Vehicles</span>
                                                <span className="text-white font-medium">{dirStats.total_vehicles}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/50">Average/Snapshot</span>
                                                <span className="text-white font-medium">{dirStats.avg_vehicles}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/50">Snapshots</span>
                                                <span className="text-white font-medium">{dirStats.record_count}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default TrendsChart;
