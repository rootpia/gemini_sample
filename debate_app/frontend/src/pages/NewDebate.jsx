import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlayCircle, Users } from 'lucide-react';

function NewDebate({ onStart }) {
    const [topic, setTopic] = useState('');
    const [rounds, setRounds] = useState(3);
    const [temperature, setTemperature] = useState(1.0);
    const [participants, setParticipants] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        axios.get('/api/participants/').then(res => setParticipants(res.data));
    }, []);

    const toggleParticipant = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (selectedIds.length < 2) return alert('Select at least 2 participants');
        setLoading(true);
        try {
            const res = await axios.post('/api/debates/', {
                topic,
                rounds,
                participant_ids: selectedIds,
                config: { temperature, model_name: 'gemini-flash-latest' }
            });
            onStart(res.data.id);
        } catch (err) {
            alert('Error creating debate');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto w-full glass rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 tracking-tight">
                <PlayCircle size={28} className="text-blue-500" /> Start New Discussion
            </h2>
            <form onSubmit={handleCreate} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Discussion Topic</label>
                    <input
                        placeholder="e.g. AI Regulation, Mars Colonization..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                        value={topic} onChange={e => setTopic(e.target.value)} required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Rounds ({rounds})</label>
                        <input
                            type="range" min="1" max="10"
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            value={rounds} onChange={e => setRounds(parseInt(e.target.value))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Temperature ({temperature})</label>
                        <input
                            type="range" min="0" max="2" step="0.1"
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                        <Users size={16} /> Select AI Participants
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {participants.map(p => (
                            <label
                                key={p.id}
                                className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${selectedIds.includes(p.id) ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-white/10 hover:border-white/20'
                                    }`}
                            >
                                <input
                                    type="checkbox" className="hidden"
                                    checked={selectedIds.includes(p.id)}
                                    onChange={() => toggleParticipant(p.id)}
                                />
                                <div className="flex-1">
                                    <p className="font-bold">{p.name}</p>
                                    <p className="text-xs text-slate-400 truncate">{p.role}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <button
                    type="submit" disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
                >
                    Initialize Debate Engine
                </button>
            </form>
        </div>
    );
}

export default NewDebate;
