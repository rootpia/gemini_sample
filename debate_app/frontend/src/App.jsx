import React, { useState } from 'react';
import ChatRoom from './pages/ChatRoom';
import ParticipantManager from './pages/ParticipantManager';
import NewDebate from './pages/NewDebate';
import History from './pages/History';

function App() {
    const [view, setView] = useState('home'); // home, debate, participants, history
    const [activeDebateId, setActiveDebateId] = useState(null);

    const startDebate = (id) => {
        setActiveDebateId(id);
        setView('debate');
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-[#0a0a0c] text-slate-200">
            <header className="glass p-4 border-b border-white/5 flex-none z-50">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        AI Debator
                    </h1>
                    <nav className="space-x-4">
                        <button onClick={() => setView('home')} className={`hover:text-blue-400 transition ${view === 'home' ? 'text-blue-400' : ''}`}>New Debate</button>
                        <button onClick={() => setView('participants')} className={`hover:text-blue-400 transition ${view === 'participants' ? 'text-blue-400' : ''}`}>Participants</button>
                        <button onClick={() => setView('history')} className={`hover:text-blue-400 transition ${view === 'history' ? 'text-blue-400' : ''}`}>History</button>
                    </nav>
                </div>
            </header>

            <main className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0 p-4 flex flex-col">
                    {view === 'home' && <NewDebate onStart={startDebate} />}
                    {view === 'participants' && <ParticipantManager />}
                    {view === 'debate' && <ChatRoom debateId={activeDebateId} />}
                    {view === 'history' && <History onSelectDebate={startDebate} />}
                </div>
            </main>
        </div>
    );
}

export default App;
