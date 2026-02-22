import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, User, Loader2, Play, Pause, GripVertical, Sidebar, X, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function ChatRoom({ debateId }) {
    const [debate, setDebate] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [isAuto, setIsAuto] = useState(false);
    const scrollRef = useRef(null);
    const [draggedIdx, setDraggedIdx] = useState(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const [retryCountdown, setRetryCountdown] = useState(0);
    const [thinkingName, setThinkingName] = useState('System');
    const [dragOverIdx, setDragOverIdx] = useState(null);

    const fetchDebate = async () => {
        try {
            const res = await axios.get(`/api/debates/${debateId}`, { timeout: 10000 });
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
        setThinkingName(participantId ? getParticipantName(participantId) : 'System');
        setLoading(true);
        setRetryCountdown(0);
        try {
            await axios.post(`/api/debates/${debateId}/next`, null, {
                params: { participant_id: participantId },
                timeout: 120000 // 120 second timeout
            });
            await fetchDebate();
        } catch (err) {
            console.error('Generation Error:', err);
            try {
                await fetchDebate(); // Try to fetch the SYSTEM turn saved by the backend
            } catch (fetchErr) {
                console.error('Fetch after error failed:', fetchErr);
            }

            if (isAuto && err.code !== 'ECONNABORTED') {
                // Schedule retry only if not a manual stop/timeout that we want to notify
                setRetryCountdown(20);
            } else if (!isAuto) {
                const msg = err.code === 'ECONNABORTED' ? 'Request timed out' : (err.response?.data?.detail || err.message);
                alert('Error generating turn: ' + msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInject = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || loading) return;
        setThinkingName('System');
        setLoading(true);
        try {
            await axios.post(`/api/debates/${debateId}/inject`, null, {
                params: { content: inputValue },
                timeout: 60000
            });
            setInputValue('');
            await fetchDebate();

            // Immediately trigger System AI response
            // We stay in loading state while System AI responds
            await handleGenerateTurn(null);
        } catch (err) {
            console.error('Injection Error:', err);
            setLoading(false);
            const msg = err.code === 'ECONNABORTED' ? 'Injection timed out' : (err.response?.data?.detail || err.message);
            alert('Failed to inject message: ' + msg);
        }
        // Note: loading is set to false inside handleGenerateTurn's finally block
    };

    const handleReorder = async (newBaseOrder) => {
        if (loading) return;
        setLoading(true);
        try {
            await axios.post(`/api/debates/${debateId}/reorder`, newBaseOrder);
            setDebate(prev => ({ ...prev, participant_order: newBaseOrder }));
            await fetchDebate(); // Refresh to ensure backend state is synced
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddOrder = (participantId) => {
        const aiTurnsCount = messages.filter(m => m.turn_type === 'AI' && m.participant_id !== null).length;
        const currentOrder = [...(debate.participant_order || [])];

        // If current order is behind the actual turns count (e.g. after deletions), 
        // pad with nulls to ensure the new participant starts in the future.
        while (currentOrder.length < aiTurnsCount) {
            currentOrder.push(null);
        }

        const newOrder = [...currentOrder, participantId];
        handleReorder(newOrder);
    };

    const handleRemoveOrder = (idx) => {
        const aiTurnsCount = messages.filter(m => m.turn_type === 'AI' && m.participant_id !== null).length;
        const newOrder = [...debate.participant_order];

        if (idx < aiTurnsCount) {
            // Removing a past turn: set to null to maintain indices of subsequent turns
            newOrder[idx] = null;
        } else {
            // Removing current/future: splice as before
            newOrder.splice(idx, 1);
        }
        handleReorder(newOrder);
    };

    const onDragStart = (idx) => {
        // We only allow dragging in the "Future" part of the sequence shown in sidebar
        const aiTurnsCount = messages.filter(m => m.turn_type === 'AI' && m.participant_id !== null).length;
        if (idx < aiTurnsCount) return;
        setDraggedIdx(idx);
    };

    const onDragOver = (e, idx) => {
        const aiTurnsCount = messages.filter(m => m.turn_type === 'AI' && m.participant_id !== null).length;
        if (idx < aiTurnsCount) return;
        e.preventDefault();
        setDragOverIdx(idx);
    };

    const onDrop = (idx) => {
        const aiTurnsCount = messages.filter(m => m.turn_type === 'AI' && m.participant_id !== null).length;
        const baseOrder = [...debate.participant_order];
        if (draggedIdx === null || draggedIdx === idx || idx < aiTurnsCount || !baseOrder.length) {
            setDraggedIdx(null);
            setDragOverIdx(null);
            return;
        }

        const newOrder = [...debate.participant_order];
        const item = newOrder.splice(draggedIdx, 1)[0];
        newOrder.splice(idx, 0, item);
        handleReorder(newOrder);
        setDraggedIdx(null);
        setDragOverIdx(null);
    };

    const getParticipantName = (id) => participants.find(p => p.id === id)?.name || 'Unknown';

    // Build the full sequence of turns
    // Static sequence refactor: participant_order is now the full sequence
    const fullTurnSequence = debate?.participant_order || [];

    const aiTurnsCount = messages.filter(m => m.turn_type === 'AI' && m.participant_id !== null).length;

    // Automatic turn generation
    useEffect(() => {
        if (isAuto && !loading && debate && debate.rounds && retryCountdown === 0) {
            const participantAiTurns = messages.filter(m => m.turn_type === 'AI' && m.participant_id !== null);
            const totalPlannedTurns = debate.participant_order?.length || 0;

            if (participantAiTurns.length < totalPlannedTurns) {
                // Find the first non-null participant starting from the current turn count index
                let nextParticipantId = null;
                for (let i = participantAiTurns.length; i < debate.participant_order.length; i++) {
                    if (debate.participant_order[i] !== null) {
                        nextParticipantId = debate.participant_order[i];
                        break;
                    }
                }

                if (nextParticipantId) {
                    handleGenerateTurn(nextParticipantId);
                } else {
                    // No more valid participants in the remaining sequence
                    setIsAuto(false);
                }
            } else {
                setIsAuto(false);
                setLoading(false);
            }
        }
    }, [isAuto, loading, messages, debate, retryCountdown]);

    // Retry Countdown handler
    useEffect(() => {
        let timer;
        if (retryCountdown > 0 && isAuto) {
            timer = setTimeout(() => {
                setRetryCountdown(prev => prev - 1);
            }, 1000);
        }
        return () => clearTimeout(timer);
    }, [retryCountdown, isAuto]);

    return (
        <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full gap-4 h-full min-h-0">
            {/* Main Chat Area */}
            <div className="flex-1 glass rounded-xl overflow-hidden flex flex-col min-w-0 min-h-0">
                <div className="flex-none p-4 border-b border-white/10 bg-white/5 flex justify-between items-center z-10">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <button
                            onClick={() => setShowSidebar(!showSidebar)}
                            className={`p-2 rounded-lg transition-all ${showSidebar ? 'bg-blue-600/20 text-blue-400' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                            title={showSidebar ? "Hide Order" : "Show Order"}
                        >
                            <Sidebar size={20} />
                        </button>
                        <div className="min-w-0">
                            <h2 className="font-bold text-lg truncate">{debate?.topic || 'Loading...'}</h2>
                            <div className="flex items-center gap-3 text-sm">
                                <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase ${debate?.status === 'COMPLETE' ? 'bg-green-600/20 text-green-400' : 'bg-amber-600/20 text-amber-400'
                                    }`}>
                                    {debate?.status || 'WIP'}
                                </span>
                                <span className="text-slate-500 whitespace-nowrap">Auto: {isAuto ? 'ON' : 'OFF'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        {retryCountdown > 0 && isAuto && (
                            <div className="text-amber-400 text-sm font-bold flex items-center gap-1 animate-pulse">
                                <Loader2 size={14} className="animate-spin" />
                                Retrying in {retryCountdown}s...
                            </div>
                        )}
                        <button
                            onClick={() => setIsAuto(!isAuto)}
                            className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition ${isAuto ? 'bg-amber-600 hover:bg-amber-500' : 'bg-green-600 hover:bg-green-500'
                                }`}
                        >
                            {isAuto ? <><Pause size={18} /> Stop Auto</> : <><Play size={18} /> Start Auto</>}
                        </button>
                    </div>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {messages.length === 0 && (
                        <div className="text-center text-slate-400 py-8">
                            <p>No messages yet. Click "Start Auto" or a participant to begin!</p>
                        </div>
                    )}
                    {messages.map((m) => (
                        <div key={m.id} className={`flex flex-col ${m.turn_type === 'USER' ? 'items-end' : 'items-start'}`}>
                            <span className="text-xs text-slate-400 mb-1">{m.participant_name}</span>
                            <div className={`max-w-[85%] p-3 rounded-2xl markdown-content ${m.turn_type === 'USER' ? 'bg-blue-600 rounded-tr-none' :
                                m.turn_type === 'SYSTEM' ? 'bg-slate-700 w-full text-center italic' :
                                    'bg-white/10 rounded-tl-none'
                                }`}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex flex-col items-start animate-pulse">
                            <span className="text-xs text-slate-400 mb-1">{thinkingName}</span>
                            <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none flex items-center gap-2 text-slate-400 italic">
                                <Loader2 size={16} className="animate-spin" />
                                <span>Thinking...</span>
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleInject} className="p-4 border-t border-white/10 bg-white/5 flex space-x-2">
                    <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Inject perspective or meta-instruction..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg transition disabled:opacity-50">
                        <Send size={20} />
                    </button>
                </form>
            </div>

            {/* Sidebar: Order & Participants */}
            {showSidebar && (
                <div className="w-full md:w-80 flex flex-col gap-4 h-64 md:h-full overflow-hidden flex-none">
                    <div className="glass rounded-xl p-4 flex flex-col h-full min-h-0">
                        <h3 className="font-bold mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                            <User size={18} /> Turn Order
                        </h3>
                        <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar pr-2">
                            {fullTurnSequence.map((pid, idx) => {
                                if (pid === null) return null; // Skip placeholder slots

                                const isPast = idx < aiTurnsCount;
                                const isCurrent = idx === aiTurnsCount;
                                const isDragging = draggedIdx === idx;
                                const isDragOver = dragOverIdx === idx;

                                return (
                                    <div
                                        key={`${pid}-${idx}`}
                                        draggable={!isPast && !(isCurrent && loading)}
                                        onDragStart={() => onDragStart(idx)}
                                        onDragOver={(e) => onDragOver(e, idx)}
                                        onDragLeave={() => setDragOverIdx(null)}
                                        onDrop={() => onDrop(idx)}
                                        onDragEnd={() => { setDraggedIdx(null); setDragOverIdx(null); }}
                                        className={`p-2 rounded-lg border flex items-center gap-2 transition group/item ${isCurrent ? 'bg-blue-600/30 border-blue-500 ring-1 ring-blue-500' :
                                            isPast ? 'bg-white/5 border-transparent opacity-40' :
                                                'bg-white/5 border-white/10'
                                            } ${isDragging ? 'opacity-20' : ''} ${isDragOver ? 'border-amber-400 bg-amber-400/10' : ''
                                            } ${(!isPast && !(isCurrent && loading)) ? 'cursor-move' : 'cursor-not-allowed'}`}
                                    >
                                        <div className="text-slate-600">
                                            {!isPast ? <GripVertical size={14} /> : <div className="w-[14px]" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-bold truncate ${isCurrent ? 'text-blue-400' : ''}`}>
                                                {getParticipantName(pid)}
                                            </p>
                                        </div>

                                        {!(isCurrent && loading) && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveOrder(idx);
                                                }}
                                                className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-red-400/20 text-slate-500 hover:text-red-400 rounded transition"
                                                title="Remove from order"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                        <div className="text-[10px] text-slate-600 font-mono">#{idx + 1}</div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4 border-t border-white/10 pt-4 shrink-0">
                            <h3 className="font-bold mb-2 text-xs flex items-center gap-2 uppercase tracking-wider text-slate-500">
                                Available AIs
                            </h3>
                            <div className="grid grid-cols-1 gap-1">
                                {participants.map(p => {
                                    const isInOrder = debate?.participant_order?.includes(p.id);
                                    return (
                                        <div key={p.id} className="flex gap-1">
                                            <button
                                                onClick={() => handleGenerateTurn(p.id)}
                                                disabled={loading}
                                                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500 px-2 py-1.5 rounded transition disabled:opacity-50 text-left text-xs min-w-0"
                                            >
                                                <p className="font-bold truncate">{p.name}</p>
                                            </button>
                                            <button
                                                onClick={() => handleAddOrder(p.id)}
                                                disabled={loading}
                                                className="px-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded transition"
                                                title="Add to sequence"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChatRoom;
