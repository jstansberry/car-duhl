import React from 'react';
import './index.css';
import GameContainer from './components/GameContainer';
import ProofSheet from './components/ProofSheet';

import GrandPrixLeaderboard from './components/GrandPrixLeaderboard';

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
    if (path === '/proof-sheet') {
        return (
            <div className="App">
                <ProofSheet />
            </div>
        );
    }

    // Default Route (Game) - Includes Grand Prix Leaderboard
    return (
        <div className="App" style={styles.appContainer}>
            <div style={styles.mainContent}>
                <GameContainer />
            </div>

            <div style={styles.leaderboardContainer}>
                <GrandPrixLeaderboard />
            </div>
        </div>
    );
}

const styles = {
    appContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '40px',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px'
    },
    mainContent: {
        flex: '1 1 500px', // Grow, shrink, basis
        maxWidth: '600px',
        minWidth: '300px'
    },
    leaderboardContainer: {
        flex: '0 0 auto', // Don't grow/shrink indiscriminately
        marginTop: '20px' // Space on mobile if wrapped
    }
};

export default App;
