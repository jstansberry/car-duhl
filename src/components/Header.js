import React, { useState } from 'react';
import Login from './Login';
import HelpModal from './HelpModal';

const Header = () => {
    const [showHelp, setShowHelp] = useState(false);

    return (
        <header style={styles.header}>
            <div style={styles.container}>
                {/* Left: Logo/Title */}
                <a href="/" style={styles.leftLink}>
                    <div style={styles.left}>
                        <h1 style={styles.title}>CAR-DUHL</h1>
                        <span style={styles.subtitle}>Guess the car in 5 tries</span>
                    </div>
                </a>

                {/* Right: Help & User Menu */}
                <div style={styles.right}>
                    <button
                        style={styles.helpButton}
                        onClick={() => setShowHelp(true)}
                        title="How to Play"
                    >
                        ?
                    </button>
                    <Login />
                </div>
            </div>

            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        </header>
    );
};

const styles = {
    header: {
        width: '100%',
        backgroundColor: '#0f0f0f', // Very dark/black background
        borderBottom: '1px solid #333',
        padding: '10px 0',
        marginBottom: '5px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
    },
    container: {
        maxWidth: '1200px', // Match App.js layout max-width
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    leftLink: {
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center'
    },
    left: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start'
    },
    right: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
    },
    title: {
        margin: 0,
        fontSize: '1.4rem',
        color: '#e94560',
        fontWeight: 'bold',
        letterSpacing: '1px',
        lineHeight: 1
    },
    subtitle: {
        fontSize: '0.75rem',
        color: '#888',
        marginTop: '2px',
        fontWeight: 'normal'
    },
    helpButton: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: '#333',
        color: '#fff',
        border: 'none',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s, transform 0.1s'
    }
};

export default Header;
