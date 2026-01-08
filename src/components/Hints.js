import React, { useState } from 'react';

const Hints = ({ country, year, funFacts, title = "Need a Hint?" }) => {
    const [revealed, setRevealed] = useState({
        origin: false,
        decade: false,
        facts: false
    });

    const toggleHint = (key) => {
        setRevealed(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const decade = year ? `${Math.floor(year / 10) * 10}s` : 'Unknown';

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>{title}</h3>
            <div style={styles.buttonGroup}>
                {/* 1. Country of Origin */}
                <div style={styles.hintBlock}>
                    <button
                        onClick={() => toggleHint('origin')}
                        style={revealed.origin ? styles.activeButton : styles.button}
                        disabled={!country}
                    >
                        Country of Origin
                    </button>
                    {revealed.origin && country && (
                        <div style={styles.content}>
                            <img
                                src={`https://flagcdn.com/h80/${country.toLowerCase()}.png`}
                                alt="Flag"
                                style={styles.flag}
                            />
                        </div>
                    )}
                </div>

                {/* 2. Decade */}
                <div style={styles.hintBlock}>
                    <button
                        onClick={() => toggleHint('decade')}
                        style={revealed.decade ? styles.activeButton : styles.button}
                        disabled={!year}
                    >
                        Decade
                    </button>
                    {revealed.decade && year && (
                        <div style={styles.content}>
                            <span style={styles.text}>{decade}</span>
                        </div>
                    )}
                </div>

                {/* 3. Specs & Fun Facts */}
                <div style={styles.hintBlock}>
                    <button
                        onClick={() => toggleHint('facts')}
                        style={revealed.facts ? styles.activeButton : styles.button}
                        disabled={!funFacts}
                    >
                        Specs & Fun Facts
                    </button>
                    {revealed.facts && funFacts && (
                        <div style={styles.content}>
                            <div style={styles.factsList}>
                                {funFacts.split('\n').map((fact, i) => (
                                    <p key={i} style={styles.factItem}>{fact.replace(/^- /, '')}</p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        marginTop: '20px',
        textAlign: 'center',
        padding: '15px',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: '12px',
    },
    title: {
        fontSize: '1rem',
        color: '#ccc',
        marginBottom: '10px',
        textTransform: 'uppercase',
        letterSpacing: '1px'
    },
    buttonGroup: {
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        flexWrap: 'wrap'
    },
    hintBlock: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        minWidth: '120px'
    },
    button: {
        padding: '8px 16px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '20px',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '0.85rem',
        transition: 'all 0.2s ease',
        width: '100%'
    },
    activeButton: {
        padding: '8px 16px',
        backgroundColor: '#a3f7bf',
        color: '#1a1a2e',
        border: '1px solid #a3f7bf',
        borderRadius: '20px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '0.85rem',
        width: '100%'
    },
    content: {
        animation: 'fadeIn 0.3s ease',
        marginTop: '5px'
    },
    flag: {
        height: '40px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        borderRadius: '4px'
    },
    text: {
        fontSize: '1.2rem',
        fontWeight: 'bold',
        color: '#fff'
    },
    factsList: {
        textAlign: 'left',
        fontSize: '0.85rem',
        color: '#ddd',
        maxWidth: '250px',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: '10px',
        borderRadius: '8px'
    },
    factItem: {
        margin: '5px 0',
        lineHeight: '1.4'
    }
};

// Add keyframe for fade in if not exists globally
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(styleSheet);

export default Hints;
