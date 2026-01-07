import React from 'react';

const GuessHistory = ({ guesses }) => {
    // Determine the points earned for each guess locally for display
    const guessesWithPoints = React.useMemo(() => {
        let totalScore = 0;
        const found = { make: false, model: false, year: false };
        const pointsMap = [25, 20, 15, 10, 5];

        return guesses.map((g, index) => {
            // Perfect First Try Bonus
            if (index === 0 && g.isMakeCorrect && g.isModelCorrect && g.isYearCorrect) {
                return { ...g, pointsEarned: 100 };
            }

            if (index > 4) return { ...g, pointsEarned: 0 };

            const pts = pointsMap[index];
            let earned = 0;

            if (!found.make && g.isMakeCorrect) {
                earned += pts;
                found.make = true;
            }
            if (!found.model && g.isModelCorrect) {
                earned += pts;
                found.model = true;
            }
            if (!found.year && g.isYearCorrect) {
                earned += pts;
                found.year = true;
            }

            return { ...g, pointsEarned: earned };
        });
    }, [guesses]);

    return (
        <div style={styles.container}>
            {guessesWithPoints.slice().reverse().map((guess, index) => {
                const isLatest = index === 0;
                // Calculate original index to get correct delay logic if needed, 
                // but purely visual "latest is top" logic works with isLatest.
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

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={styles.indicators}>
                                <Indicator
                                    isCorrect={guess.isMakeCorrect}
                                    label="Make"
                                    delay={isLatest ? 0.1 : 0}
                                />
                                <Indicator
                                    isCorrect={guess.isModelCorrect}
                                    label="Model"
                                    delay={isLatest ? 0.2 : 0}
                                />
                                <Indicator
                                    isCorrect={guess.isYearCorrect}
                                    label="Year"
                                    delay={isLatest ? 0.3 : 0}
                                />
                            </div>
                            <div style={{
                                ...styles.scoreBadge,
                                animation: isLatest ? 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' : 'none',
                                opacity: isLatest ? 0 : 1,
                                animationDelay: isLatest ? '0.4s' : '0s'
                            }}>
                                +{guess.pointsEarned}
                            </div>
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
        animation: `simpleFadeIn 0.5s ease-in-out forwards`,
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
    },
    scoreBadge: {
        background: 'linear-gradient(135deg, #ffd700 0%, #daa520 100%)',
        color: '#333',
        padding: '4px 8px',
        borderRadius: '12px',
        fontWeight: 'bold',
        fontSize: '0.8rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)',
        minWidth: '35px',
        textAlign: 'center',
        textShadow: '0 1px 0 rgba(255,255,255,0.3)'
    }
};

// Add keyframes for popIn
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes popIn {
    0% { transform: scale(0.5); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
}
`;
document.head.appendChild(styleSheet);

export default GuessHistory;
