import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Trash2, Save } from 'lucide-react';

function ParticipantManager() {
    const [participants, setParticipants] = useState([]);
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [systemInstruction, setSystemInstruction] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchParticipants = async () => {
        const res = await axios.get('/api/participants/');
        setParticipants(res.data);
    };

    useEffect(() => {
        fetchParticipants();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/participants/', { name, role, system_instruction: systemInstruction });
            setName('');
            setRole('');
            setSystemInstruction('');
            await fetchParticipants();
        } catch (err) {
            alert(err.response?.data?.detail || 'Error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return;
        await axios.delete(`/api/participants/${id}`);
        await fetchParticipants();
    };

    return (
        <div className="max-w-4xl mx-auto w-full space-y-6">
            <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <UserPlus /> Add New Participant
                </h2>
                <form onSubmit={handleAdd} className="space-y-4">
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
                    <button
                        type="submit" disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded-lg font-bold transition flex items-center justify-center gap-2"
                    >
                        <Save size={20} /> Register Participant
                    </button>
                </form>
            </div>

            <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Saved Participants</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {participants.map(p => (
                        <div key={p.id} className="bg-white/5 border border-white/10 p-4 rounded-lg flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-blue-400">{p.name}</h3>
                                <p className="text-sm text-slate-400">{p.role}</p>
                            </div>
                            <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ParticipantManager;
