import React, { useState, useEffect } from 'react';
import { FaHistory, FaFilter, FaChevronLeft, FaChevronRight, FaEye, FaCalendarAlt, FaRoad } from 'react-icons/fa';
import { API_URL } from '../config';

const HistoryPage = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [direction, setDirection] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);

    const directions = [
        { value: '', label: 'All Directions' },
        { value: 'north', label: 'North' },
        { value: 'east', label: 'East' },
        { value: 'south', label: 'South' },
        { value: 'west', label: 'West' },
    ];

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page, per_page: 12 });
            if (direction) params.append('direction', direction);

            const response = await fetch(`${API_URL}/api/history?${params}`);
            const data = await response.json();

            if (data.success) {
                setRecords(data.records);
                setTotalPages(data.pages);
            } else {
                throw new Error(data.error || 'Failed to fetch history');
            }
        } catch (err) {
            setError(err.message);
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [page, direction]);

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDirectionColor = (dir) => {
        const colors = {
            north: 'from-blue-500 to-blue-600',
            east: 'from-emerald-500 to-emerald-600',
            south: 'from-amber-500 to-amber-600',
            west: 'from-violet-500 to-violet-600'
        };
        return colors[dir] || 'from-gray-500 to-gray-600';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="glass-card p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                            <FaHistory className="text-white text-xl" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Traffic History</h1>
                            <p className="text-white/60 text-sm">Browse past traffic snapshots</p>
                        </div>
                    </div>

                    {/* Filter */}
                    <div className="flex items-center gap-3">
                        <FaFilter className="text-white/50" />
                        <select
                            value={direction}
                            onChange={(e) => { setDirection(e.target.value); setPage(1); }}
                            className="bg-surface-800 text-white rounded-lg px-4 py-2 border border-white/10 focus:border-brand-500 focus:outline-none"
                        >
                            {directions.map(d => (
                                <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="glass-card p-12 text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-white/60">Loading history...</p>
                </div>
            ) : error ? (
                <div className="glass-card p-12 text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button onClick={fetchHistory} className="btn-primary">Retry</button>
                </div>
            ) : records.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <FaHistory className="text-6xl text-white/20 mx-auto mb-4" />
                    <p className="text-white/60">No traffic records found</p>
                    <p className="text-white/40 text-sm mt-2">Upload some traffic images to see history</p>
                </div>
            ) : (
                <>
                    {/* Records Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {records.map((record) => (
                            <div
                                key={record.id}
                                className="glass-card p-4 hover:border-brand-500/50 transition-all cursor-pointer group"
                                onClick={() => setSelectedImage(record)}
                            >
                                {/* Image Thumbnail */}
                                <div className="relative aspect-video rounded-lg overflow-hidden bg-surface-800 mb-4">
                                    {record.processed_image_id ? (
                                        <img
                                            src={`${API_URL}/api/image/${record.processed_image_id}`}
                                            alt={`${record.direction} traffic`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <FaRoad className="text-4xl text-white/20" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                                        <span className="flex items-center gap-2 text-white text-sm">
                                            <FaEye /> View Details
                                        </span>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getDirectionColor(record.direction)} text-white capitalize`}>
                                            {record.direction}
                                        </span>
                                        <span className="text-white font-semibold">{record.vehicle_count} vehicles</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-white/50 text-xs">
                                        <FaCalendarAlt />
                                        {formatDate(record.created_at)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-700 transition-colors"
                            >
                                <FaChevronLeft /> Previous
                            </button>
                            <span className="text-white/60">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-700 transition-colors"
                            >
                                Next <FaChevronRight />
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div
                        className="glass-card max-w-4xl w-full max-h-[90vh] overflow-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white capitalize">{selectedImage.direction} Direction</h2>
                                    <p className="text-white/60">{formatDate(selectedImage.created_at)}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="text-white/50 hover:text-white text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            {selectedImage.processed_image_id && (
                                <img
                                    src={`${API_URL}/api/image/${selectedImage.processed_image_id}`}
                                    alt={`${selectedImage.direction} traffic`}
                                    className="w-full rounded-lg mb-4"
                                />
                            )}

                            <div className="flex items-center justify-center gap-6 text-center">
                                <div className="glass-card px-6 py-4">
                                    <p className="text-3xl font-bold text-brand-400">{selectedImage.vehicle_count}</p>
                                    <p className="text-white/60 text-sm">Vehicles Detected</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
