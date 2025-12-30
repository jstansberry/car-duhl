import React, { useState } from 'react';

const GameOverModal = ({ dailyCar, guesses, gameState, onClose }) => {
    const [copied, setCopied] = useState(false);

    if (gameState === 'playing') return null;

    const generateShareText = () => {
        const date = new Date().toISOString().split('T')[0];
        const status = gameState === 'won' ? `${guesses.length}/5` : 'X/5';

        let text = `Car-duhl ${date} ${status}\n\n`;

        guesses.forEach((guess, index) => {
            const makeIcon = guess.isMakeCorrect ? '🟢' : '🔴';
            const modelIcon = guess.isModelCorrect ? '🟢' : '🔴';
            const yearIcon = guess.isYearCorrect ? '🟢' : '🔴';

            text += `${index + 1}. ${makeIcon}${modelIcon}${yearIcon} ${guess.make} ${guess.model} ${guess.year}\n`;
        });

        text += '\nPlay at: https://carduhl.vercel.app/'; // Update with real URL later
        return text;
    };

    const handleShare = () => {
        const text = generateShareText();
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal} className="glass-panel">
                <h2 style={styles.title}>
                    {gameState === 'won' ? 'VICTORY!' : 'GAME OVER'}
                </h2>

                <div style={styles.carDisplay}>
                    <img
                        src={dailyCar.gameOverImageURL || dailyCar.imageUrl}
                        alt="The Car"
                        style={styles.image}
                    />
                    <div style={styles.carDetails}>
                        <h3>{dailyCar.year} {dailyCar.make} {dailyCar.model}</h3>
                    </div>
                </div>

                <div style={styles.stats}>
                    <p>Attempts: {guesses.length}/5</p>
                </div>

                <button
                    onClick={handleShare}
                    style={{
                        ...styles.shareButton,
                        backgroundColor: copied ? '#4caf50' : '#e94560'
                    }}
                >
                    {copied ? 'COPIED TO CLIPBOARD!' : 'SHARE RESULT'}
                </button>

                <div style={styles.resultPreview}>
                    <h4>Result Summary:</h4>
                    {guesses.map((guess, idx) => (
                        <div key={idx} style={styles.previewLine}>
                            <span style={styles.previewNumber}>{idx + 1}.</span>
                            <span style={styles.previewIcons}>
                                {guess.isMakeCorrect ? '🟢' : '🔴'}
                                {guess.isModelCorrect ? '🟢' : '🔴'}
                                {guess.isYearCorrect ? '🟢' : '🔴'}
                            </span>
                            <span style={styles.previewText}>
                                {guess.make} {guess.model} {guess.year}
                            </span>
                        </div>
                    ))}
                </div>

                <button onClick={onClose} style={styles.closeButton}>
                    Close
                </button>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(5px)',
    },
    modal: {
        padding: '30px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.2)',
    },
    title: {
        fontSize: '2rem',
        marginBottom: '20px',
        background: '-webkit-linear-gradient(45deg, #e94560, #a3f7bf)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    carDisplay: {
        width: '100%',
        marginBottom: '20px',
    },
    image: {
        width: '100%',
        borderRadius: '8px',
        marginBottom: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    },
    carDetails: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#fff',
    },
    stats: {
        marginBottom: '20px',
        color: '#ccc',
    },
    shareButton: {
        width: '100%',
        padding: '12px',
        border: 'none',
        borderRadius: '8px',
        color: 'white',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginBottom: '20px',
        transition: 'background-color 0.3s',
    },
    resultPreview: {
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'left',
    },
    previewLine: {
        display: 'flex',
        alignItems: 'center', // Add this to align items vertically center
        justifyContent: 'flex-start', // Change from space-between to flex-start
        marginBottom: '5px',
        fontSize: '0.9rem',
        color: '#ccc',
    },
    previewNumber: {
        marginRight: '10px',
        color: '#888',
    },
    previewText: {
        flex: 1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    previewIcons: {
        letterSpacing: '2px',
        marginRight: '10px',
    },
    closeButton: {
        background: 'transparent',
        border: '1px solid #666',
        color: '#888',
        padding: '8px 20px',
        borderRadius: '4px',
        cursor: 'pointer',
        marginTop: '10px',
    }
};

export default GameOverModal;
