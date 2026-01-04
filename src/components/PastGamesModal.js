import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const PastGamesModal = ({ onClose }) => {
    const { user } = useAuth();
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScores = async () => {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from('user_scores')
                    .select(`
                        score,
                        created_at,
                        daily_game:daily_games (
                            date,
                            year,
                            make:makes (name),
                            model:models (name)
                        )
                    `)
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                setScores(data || []);
            } catch (error) {
                console.error('Error fetching past games:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchScores();
    }, [user]);

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Your Past Games</h2>
                    <button onClick={onClose} style={styles.closeButton}>×</button>
                </div>

                <div style={styles.content}>
                    {loading ? (
                        <p style={styles.message}>Loading history...</p>
                    ) : scores.length === 0 ? (
                        <p style={styles.message}>You haven't played any games yet.</p>
                    ) : (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Date</th>
                                    <th style={styles.th}>Car</th>
                                    <th style={styles.th}>Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scores.map((item, index) => {
                                    const game = item.daily_game;
                                    // Fallback if daily_game is missing (shouldn't happen with inner join, but safe)
                                    if (!game) return null;

                                    const carName = `${game.year} ${game.make?.name || ''} ${game.model?.name || ''}`;

                                    return (
                                        <tr key={index} style={styles.tr}>
                                            <td style={styles.td}>{game.date}</td>
                                            <td style={styles.td}>{carName}</td>
                                            <td style={{ ...styles.td, fontWeight: 'bold', color: item.score >= 100 ? '#e94560' : '#fff' }}>
                                                {item.score}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
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
        padding: '20px'
    },
    modal: {
        backgroundColor: '#1a1a2e',
        padding: '25px',
        borderRadius: '12px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh', // Ensure it fits on screen
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #e94560',
        boxShadow: '0 0 20px rgba(233, 69, 96, 0.2)'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '10px'
    },
    title: {
        color: '#e94560',
        margin: 0,
        fontSize: '1.5rem'
    },
    closeButton: {
        background: 'none',
        border: 'none',
        color: '#fff',
        fontSize: '2rem',
        cursor: 'pointer',
        padding: '0 10px',
        lineHeight: 1
    },
    content: {
        overflowY: 'auto', // Vertical scroll
        flex: 1
    },
    message: {
        textAlign: 'center',
        color: '#ccc',
        marginTop: '20px'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        color: '#fff',
        fontSize: '0.95rem'
    },
    th: {
        textAlign: 'left',
        padding: '12px',
        borderBottom: '1px solid #e94560',
        color: '#e94560',
        position: 'sticky',
        top: 0,
        backgroundColor: '#1a1a2e' // Cover scrolling content
    },
    tr: {
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    },
    td: {
        padding: '12px',
    }
};

export default PastGamesModal;
