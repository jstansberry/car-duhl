import React from 'react';
import './index.css';
import GameContainer from './components/GameContainer';
import ProofSheet from './components/ProofSheet';
import GrandPrixLeaderboard from './components/GrandPrixLeaderboard';
import Header from './components/Header';

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
            <div className="App" style={styles.appWrapper}>
                <Header />
                <ProofSheet />
            </div>
        );
    }

    // Default Route (Game) - Includes Grand Prix Leaderboard
    return (
        <div className="App" style={styles.appWrapper}>
            <Header />

            <div style={styles.mainContainer}>
                <div style={styles.gameColumn}>
                    <GameContainer />
                </div>

                <div style={styles.sidebarColumn}>
                    <GrandPrixLeaderboard />
                </div>
            </div>
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
    }
};

export default App;
