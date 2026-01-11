import React from 'react';
import './index.css';
import GameContainer from './components/GameContainer';
import ProofSheet from './components/ProofSheet';
import GrandPrixLeaderboard from './components/GrandPrixLeaderboard';
import Header from './components/Header';
import { Analytics } from '@vercel/analytics/react';

import PrivacyPolicy from './components/PrivacyPolicy';
import InfoSection from './components/InfoSection';

function App() {
    const [path, setPath] = React.useState(window.location.pathname);

    React.useEffect(() => {
        const handlePopState = () => {
            setPath(window.location.pathname);
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Simple Router
    let content;
    if (path === '/proof-sheet') {
        content = <ProofSheet />;
    } else if (path === '/privacy') {
        content = <PrivacyPolicy />;
    } else {
        // Default Route (Game) - Includes Grand Prix Leaderboard
        content = (
            <div className="main-container">
                <div className="game-column">
                    <GameContainer />
                </div>

                <div className="sidebar-column">
                    <GrandPrixLeaderboard />
                </div>
            </div>
        );
    }

    return (
        <div className="app-wrapper">
            <Header />

            {content}

            <InfoSection />

            <Analytics />

            <footer className="app-footer">
                <div className="footer-content">
                    <span>&copy; 2026 My Daily Garage</span>
                    <a href="/privacy" className="footer-link">Privacy Policy</a>
                    <a href="/" className="footer-link">Home</a>
                </div>
            </footer>
        </div>
    );
}

export default App;
