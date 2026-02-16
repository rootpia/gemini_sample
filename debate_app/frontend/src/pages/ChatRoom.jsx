import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, User, Loader2 } from 'lucide-react';

function ChatRoom({ debateId }) {
    const [debate, setDebate] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    const fetchDebate = async () => {
        try {
            const res = await axios.get(`/api/debates/${debateId}`);
            setDebate(res.data);
            setMessages(res.data.turns);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchParticipants = async () => {
        try {
            const res = await axios.get('/api/participants/');
            setParticipants(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchDebate();
        fetchParticipants();
    }, [debateId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleGenerateTurn = async (participantId) => {
        if (loading) return;
        setLoading(true);
        try {
            await axios.post(`/api/debates/${debateId}/next`, null, { params: { participant_id: participantId } });
            await fetchDebate();
        } catch (err) {
            console.error(err);
            alert('Error generating turn: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleInject = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || loading) return;
        setLoading(true);
        try {
            await axios.post(`/api/debates/${debateId}/inject`, null, { params: { content: inputValue } });
            setInputValue('');
            await fetchDebate();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full gap-4">
            <div className="glass rounded-xl overflow-hidden flex-1 flex flex-col">
                <div className="p-4 border-b border-white/10 bg-white/5">
                    <h2 className="font-bold text-lg">{debate?.topic || 'Loading...'}</h2>
                    <p className="text-sm text-slate-400">Click on a participant to generate their response</p>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {messages.length === 0 && (
                        <div className="text-center text-slate-400 py-8">
                            <p>No messages yet. Click on a participant below to start the debate!</p>
                        </div>
                    )}
                    {messages.map((m) => (
                        <div key={m.id} className={`flex flex-col ${m.turn_type === 'USER' ? 'items-end' : 'items-start'}`}>
                            <span className="text-xs text-slate-400 mb-1">{m.participant_name}</span>
                            <div className={`max-w-[80%] p-3 rounded-2xl ${m.turn_type === 'USER' ? 'bg-blue-600 rounded-tr-none' :
                                    m.turn_type === 'SYSTEM' ? 'bg-slate-700 w-full text-center italic' :
                                        'bg-white/10 rounded-tl-none'
                                }`}>
                                {m.content}
                            </div>
                        </div>
                    ))}
                    {loading && <div className="flex justify-center"><Loader2 className="animate-spin" /></div>}
                </div>

                <form onSubmit={handleInject} className="p-4 border-t border-white/10 bg-white/5 flex space-x-2">
                    <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Inject perspective or meta-instruction (summarize, change tone...)"
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg transition disabled:opacity-50">
                        <Send size={20} />
                    </button>
                </form>
            </div>

            <div className="glass rounded-xl p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                    <User size={18} /> AI Participants
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {participants.map(p => (
                        <button
                            key={p.id}
                            onClick={() => handleGenerateTurn(p.id)}
                            disabled={loading}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500 p-3 rounded-lg transition disabled:opacity-50 text-left"
                        >
                            <p className="font-bold text-sm">{p.name}</p>
                            <p className="text-xs text-slate-400 truncate">{p.role}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ChatRoom;
