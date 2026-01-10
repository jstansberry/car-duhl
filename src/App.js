import React from 'react';
import './index.css';
import GameContainer from './components/GameContainer';
import ProofSheet from './components/ProofSheet';
import GrandPrixLeaderboard from './components/GrandPrixLeaderboard';
import Header from './components/Header';
import { Analytics } from '@vercel/analytics/react';

import PrivacyPolicy from './components/PrivacyPolicy';

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
            <div style={styles.mainContainer}>
                <div style={styles.gameColumn}>
                    <GameContainer />
                </div>

                <div style={styles.sidebarColumn}>
                    <GrandPrixLeaderboard />
                </div>
            </div>
        );
    }

    return (
        <div className="App" style={styles.appWrapper}>
            <Header />

            {content}

            <Analytics />

            <footer style={styles.footer}>
                <div style={styles.footerContent}>
                    <span>&copy; 2026 My Daily Garage</span>
                    <a href="/privacy" style={styles.footerLink}>Privacy Policy</a>
                    <a href="/" style={styles.footerLink}>Home</a>
                </div>
            </footer>
        </div>
    );
}

const styles = {
    appWrapper: {
        minHeight: '100vh',
        backgroundColor: '#4c4c4c', // Lightened by ~25%
        color: '#fff',
        fontFamily: 'Arial, sans-serif'
    },
    mainContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '40px',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px 40px 20px'
    },
    gameColumn: {
        flex: '1 1 600px', // Grow/Shrink foundation 600px
        minWidth: '300px',
        maxWidth: '650px', // Limit width to keep game tight
        display: 'flex',
        justifyContent: 'center' // Center the game container
    },
    sidebarColumn: {
        flex: '0 0 auto',
        marginTop: '20px' // Align with GameContainer padding (20px) so image and leaderboard tops align
    },
    footer: {
        width: '100%',
        padding: '40px 0 20px 0',
        marginTop: 'auto',
        borderTop: '1px solid #333',
        backgroundColor: 'rgba(0,0,0,0.2)'
    },
    footerContent: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        fontSize: '0.8rem',
        color: '#888'
    },
    footerLink: {
        color: '#888',
        textDecoration: 'none',
        transition: 'color 0.2s'
    }
};

export default App;
