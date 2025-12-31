import React from 'react';

const GuessHistory = ({ guesses }) => {
    return (
        <div style={styles.container}>
            {guesses.slice().reverse().map((guess, index) => {
                const isLatest = index === 0;
                return (
                    <div key={guesses.length - index} style={{
                        ...styles.row,
                        animation: `fadeIn 0.5s ease-out forwards`,
                        opacity: 0,
                        animationDelay: isLatest ? '0s' : '0s' // New rows appear immediately, dots follow
                    }}>
                        <div style={styles.guessText}>
                            <span style={{ marginRight: '10px', color: '#666', fontWeight: 'bold' }}>
                                #{guesses.length - index}
                            </span>
                            {guess.make} {guess.model} {guess.year}
                        </div>
                        <div style={styles.indicators}>
                            <Indicator
                                isCorrect={guess.isMakeCorrect}
                                label="Make"
                                delay={isLatest ? 0.5 : 0}
                            />
                            <Indicator
                                isCorrect={guess.isModelCorrect}
                                label="Model"
                                delay={isLatest ? 1.5 : 0}
                            />
                            <Indicator
                                isCorrect={guess.isYearCorrect}
                                label="Year"
                                delay={isLatest ? 2.5 : 0}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const Indicator = ({ isCorrect, label, delay = 0 }) => (
    <div style={{
        ...styles.indicator,
        backgroundColor: isCorrect ? '#4caf50' : '#f44336',
        animation: `simpleFadeIn 1s ease-in-out forwards`,
        opacity: 0,
        animationDelay: `${delay}s`
    }} title={label}>
    </div>
);

const styles = {
    container: {
        marginTop: '20px',
        width: '100%',
        maxWidth: '500px',
    },
    row: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px',
        borderBottom: '1px solid #eee',
        backgroundColor: '#fff',
        borderRadius: '4px',
        marginBottom: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    guessText: {
        fontWeight: '500',
        color: '#333'
    },
    indicators: {
        display: 'flex',
        gap: '8px'
    },
    indicator: {
        width: '24px',
        height: '24px',
        borderRadius: '50%',
    }
};

export default GuessHistory;
