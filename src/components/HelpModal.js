import React from 'react';

const HelpModal = ({ onClose }) => {
    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <button style={styles.closeButton} onClick={onClose}>&times;</button>

                <h2 style={styles.header}>Help & Rules</h2>

                <div style={styles.scrollContainer}>
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>How to Play</h3>
                        <p>Guess the daily car in 5 attempts or less.</p>

                        <h4>The Clues</h4>
                        <ul>
                            <li><strong>Start (Guess #1):</strong> You get a tiny, zoomed-in detail of the car.</li>
                            <li><strong>Next Guesses:</strong> With each incorrect guess, the image zooms out to reveal more.</li>
                            <li><strong>Full Reveal:</strong> After 5 guesses or a correct answer, the full car is revealed.</li>
                        </ul>

                        <h4>Scoring</h4>
                        <p>Based on how quickly you solve it:</p>
                        <ul><li><strong>1st Guess:</strong> 100 pts  (all 3 correct extra 25pts!)</li>
                            <li><strong>1st Guess:</strong> 25 pts (each correct item)</li>
                            <li><strong>2nd Guess:</strong> 20 pts</li>
                            <li><strong>3rd Guess:</strong> 15 pts</li>
                            <li><strong>4th Guess:</strong> 10 pts</li>
                            <li><strong>5th Guess:</strong> 5 pts</li>
                        </ul>
                        <p> You may only score once per Make, Model, and Year. Even if you don't solve the puzzle, you still score for what you get correct.</p>
                    </div>

                    <div style={styles.divider} />

                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>The Grand Prix</h3>
                        <p>The Grand Prix is our weekly competition.</p>
                        <ul>
                            <li><strong>Schedule:</strong> Runs from Monday to Sunday.</li>
                            <li><strong>Objective:</strong> Accumulate the highest total score over the week.</li>
                            <li><strong>Winner:</strong> The driver with the most points on Sunday night takes the podium!</li>
                        </ul>
                        <p>Login is required to participate in the leaderboard.</p>
                    </div>
                </div>
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
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(5px)'
    },
    modal: {
        backgroundColor: '#1a1a1a',
        padding: '30px',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '85vh', // Allow scrolling if tall
        position: 'relative',
        color: '#fff',
        border: '1px solid #333',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column'
    },
    scrollContainer: {
        overflowY: 'auto',
        paddingRight: '10px' // Space for scrollbar
    },
    closeButton: {
        position: 'absolute',
        top: '15px',
        right: '15px',
        background: 'none',
        border: 'none',
        color: '#888',
        fontSize: '24px',
        cursor: 'pointer',
        padding: '5px',
        lineHeight: 1,
        zIndex: 10
    },
    header: {
        marginTop: 0,
        textAlign: 'center',
        color: '#e94560',
        marginBottom: '20px',
        flexShrink: 0
    },
    section: {
        marginBottom: '20px'
    },
    sectionTitle: {
        color: '#fff',
        borderBottom: '1px solid #333',
        paddingBottom: '10px',
        marginBottom: '15px',
        marginTop: 0
    },
    divider: {
        height: '1px',
        backgroundColor: '#333',
        margin: '20px 0'
    }
};

export default HelpModal;
