import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, MessageSquare, ChevronRight, Trash2 } from 'lucide-react';

function History({ onSelectDebate }) {
    const [debates, setDebates] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDebates = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/debates/');
            setDebates(res.data);
        } catch (err) {
            console.error("Failed to fetch debates:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDebates();
    }, []);

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this debate history?")) return;

        try {
            await axios.delete(`/api/debates/${id}`);
            fetchDebates();
        } catch (err) {
            console.error("Failed to delete debate:", err);
            alert("Failed to delete debate.");
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-xl text-slate-400">Loading history...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto w-full space-y-6 my-4 p-4">
                <div className="flex items-center gap-3 mb-2">
                    <Clock className="text-blue-400" size={28} />
                    <h2 className="text-2xl font-bold text-white">Debate History</h2>
                </div>

                {debates.length === 0 ? (
                    <div className="glass p-12 text-center rounded-xl">
                        <MessageSquare size={48} className="mx-auto text-slate-500 mb-4 opacity-20" />
                        <p className="text-slate-400 text-lg">No past debates found.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {debates.map((debate) => (
                            <div
                                key={debate.id}
                                onClick={() => onSelectDebate(debate.id)}
                                className="glass p-5 rounded-xl text-left hover:scale-[1.01] transition-all hover:bg-white/10 group flex items-center justify-between cursor-pointer"
                            >
                                <div className="space-y-1 flex-1 min-w-0">
                                    <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition break-words">
                                        {debate.topic}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {formatDate(debate.created_at)}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${debate.status === 'active' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'
                                            }`}>
                                            {debate.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={(e) => handleDelete(e, debate.id)}
                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                        title="Delete History"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                    <ChevronRight size={24} className="text-slate-500 group-hover:text-blue-400 transition" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default History;
