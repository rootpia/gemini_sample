import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Trash2, Save } from 'lucide-react';

function ParticipantManager() {
    const [participants, setParticipants] = useState([]);
    const [editId, setEditId] = useState(null);
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [systemInstruction, setSystemInstruction] = useState('');
    const [temperature, setTemperature] = useState(1.0);
    const [loading, setLoading] = useState(false);

    const fetchParticipants = async () => {
        const res = await axios.get('/api/participants/');
        setParticipants(res.data);
    };

    useEffect(() => {
        fetchParticipants();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = { name, role, system_instruction: systemInstruction, temperature };
            if (editId) {
                await axios.put(`/api/participants/${editId}`, data);
            } else {
                await axios.post('/api/participants/', data);
            }
            resetForm();
            await fetchParticipants();
        } catch (err) {
            alert(err.response?.data?.detail || 'Error');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEditId(null);
        setName('');
        setRole('');
        setSystemInstruction('');
        setTemperature(1.0);
    };

    const handleEdit = (p) => {
        setEditId(p.id);
        setName(p.name);
        setRole(p.role);
        setSystemInstruction(p.system_instruction);
        setTemperature(p.temperature || 1.0);
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!confirm('Are you sure?')) return;
        await axios.delete(`/api/participants/${id}`);
        await fetchParticipants();
        if (editId === id) resetForm();
    };

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto w-full space-y-6 my-4">
                <div className="glass rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <UserPlus /> {editId ? 'Edit Participant' : 'Add New Participant'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                placeholder="Name (e.g. Pro-AI Advocate)"
                                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={name} onChange={e => setName(e.target.value)} required
                            />
                            <input
                                placeholder="Role Description"
                                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={role} onChange={e => setRole(e.target.value)} required
                            />
                        </div>
                        <textarea
                            placeholder="System Instruction (detailed behavior, tone, etc.)"
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={systemInstruction} onChange={e => setSystemInstruction(e.target.value)} required
                        />
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Default Temperature ({temperature})</label>
                            <input
                                type="range" min="0" max="2" step="0.1"
                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit" disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded-lg font-bold transition flex items-center justify-center gap-2"
                            >
                                <Save size={20} /> {editId ? 'Update Participant' : 'Register Participant'}
                            </button>
                            {editId && (
                                <button
                                    type="button" onClick={resetForm}
                                    className="px-6 bg-white/10 hover:bg-white/20 py-2 rounded-lg font-bold transition"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="glass rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4">Saved Participants</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {participants.map(p => (
                            <div
                                key={p.id}
                                onClick={() => handleEdit(p)}
                                className={`p-4 rounded-lg flex justify-between items-start cursor-pointer transition border ${editId === p.id ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-white/10 hover:border-white/20'
                                    }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-blue-400 truncate">{p.name}</h3>
                                    <p className="text-sm text-slate-400 truncate">{p.role}</p>
                                    <p className="text-[10px] text-slate-500 mt-1">Temp: {p.temperature || 1.0}</p>
                                </div>
                                <button onClick={(e) => handleDelete(e, p.id)} className="text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition shrink-0 ml-2">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ParticipantManager;
