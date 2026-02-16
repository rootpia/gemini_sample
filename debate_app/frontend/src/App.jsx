import React, { useState } from 'react';
import ChatRoom from './pages/ChatRoom';
import ParticipantManager from './pages/ParticipantManager';
import NewDebate from './pages/NewDebate';

function App() {
    const [view, setView] = useState('home'); // home, debate, participants
    const [activeDebateId, setActiveDebateId] = useState(null);

    const startDebate = (id) => {
        setActiveDebateId(id);
        setView('debate');
    };

    return (
        <div className="min-h-screen flex flex-col">
            <header className="glass p-4 sticky top-0 z-50">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Gemini Debate
                    </h1>
                    <nav className="space-x-4">
                        <button onClick={() => setView('home')} className={`hover:text-blue-400 transition ${view === 'home' ? 'text-blue-400' : ''}`}>New Debate</button>
                        <button onClick={() => setView('participants')} className={`hover:text-blue-400 transition ${view === 'participants' ? 'text-blue-400' : ''}`}>Participants</button>
                    </nav>
                </div>
            </header>

            <main className="flex-1 container mx-auto p-4 flex flex-col">
                {view === 'home' && <NewDebate onStart={startDebate} />}
                {view === 'participants' && <ParticipantManager />}
                {view === 'debate' && <ChatRoom debateId={activeDebateId} />}
            </main>
        </div>
    );
}

export default App;
