import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlayCircle, Users } from 'lucide-react';

function NewDebate({ onStart }) {
    const [topic, setTopic] = useState('');
    const [rounds, setRounds] = useState(3);
    const [participants, setParticipants] = useState([]);
    const [selectedParticipants, setSelectedParticipants] = useState([]); // List of participants in order
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        axios.get('/api/participants/').then(res => setParticipants(res.data));
    }, []);

    const toggleParticipant = (p) => {
        const isSelected = selectedParticipants.some(sp => sp.id === p.id);
        if (isSelected) {
            setSelectedParticipants(prev => prev.filter(sp => sp.id !== p.id));
        } else {
            setSelectedParticipants(prev => [...prev, p]);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (selectedParticipants.length < 2) return alert('Select at least 2 participants');
        setLoading(true);
        try {
            // Update individual temperatures in DB first? 
            // The requirement says "GeminiAPI初期化時にtempratureを与えるように修正" 
            // and the participant temperature is already in the database if updated via ParticipantManager.
            // But here we can override or just pass the order.
            // The backend DiscussionService now uses the participant's DB temperature.
            // To be safe, we can update the participant temperature here or pass it in a way the backend uses it.
            // Let's assume the backend will use the order and the participants' current DB temperatures.
            // If the user changes it here, we should probably update it.

            // Removed per-participant temperature update logic

            const selectedIds = selectedParticipants.map(sp => sp.id);
            // Expand the order to a full static sequence: [A, B, A, B, A, B] for 3 rounds of A & B
            const expandedOrder = [];
            for (let i = 0; i < rounds; i++) {
                expandedOrder.push(...selectedIds);
            }

            const res = await axios.post('/api/debates/', {
                topic,
                rounds,
                participant_ids: selectedIds,
                participant_order: expandedOrder,
                config: { model_name: 'gemini-flash-latest' }
            });
            onStart(res.data.id);
        } catch (err) {
            alert('Error creating debate');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-2xl mx-auto w-full glass rounded-xl p-8 my-4">
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

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Rounds ({rounds})</label>
                        <input
                            type="range" min="1" max="10"
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            value={rounds} onChange={e => setRounds(parseInt(e.target.value))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                            <Users size={16} /> Select AI Participants (in order of speaking)
                        </label>
                        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {participants.map(p => {
                                const isSelected = selectedParticipants.some(sp => sp.id === p.id);
                                const selectedIndex = selectedParticipants.findIndex(sp => sp.id === p.id);

                                return (
                                    <label
                                        key={p.id}
                                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${isSelected ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <input
                                            type="checkbox" className="hidden"
                                            checked={isSelected}
                                            onChange={() => toggleParticipant(p)}
                                        />
                                        <div className="flex-1">
                                            <p className="font-bold flex items-center gap-2">
                                                {isSelected && (
                                                    <span className="bg-blue-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                                                        {selectedIndex + 1}
                                                    </span>
                                                )}
                                                {p.name}
                                            </p>
                                            <p className="text-xs text-slate-400 truncate">{p.role}</p>
                                        </div>
                                    </label>
                                );
                            })}
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
        </div>
    );
}

export default NewDebate;
