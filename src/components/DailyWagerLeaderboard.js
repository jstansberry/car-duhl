'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const DailyWagerLeaderboard = () => {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                // Fetch from the secure view which handles aggregation and username access
                const { data, error } = await supabase
                    .from('daily_wager_standings_view')
                    .select('*')
                    .order('wins', { ascending: false })
                    .limit(10);

                if (error) throw error;

                setLeaders(data || []);
            } catch (error) {
                console.error("Leaderboard error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    return (
        <div style={styles.towerContainer}>
            <div style={styles.towerHeader}>
                <div style={styles.flagIcon}>💰</div>
                <div style={styles.titleContainer}>
                    <div style={styles.titleRow}>
                        <h3 style={styles.towerTitle}>DAILY WAGER</h3>
                    </div>
                    <span style={styles.weekLabel}>TOP EARNERS</span>
                </div>
            </div>

            <div style={styles.listContainer}>
                {loading ? (
                    <div style={styles.loading}>Calculating...</div>
                ) : leaders.length === 0 ? (
                    <div style={styles.empty}>No winners yet!</div>
                ) : (
                    leaders.map((player, index) => {
                        // Rank logic: handle ties? For now simple index + 1
                        const rank = index + 1;
                        const isFirst = rank === 1;

                        return (
                            <div
                                key={player.user_id}
                                style={{
                                    ...styles.driverRow,
                                    ...(isFirst ? styles.firstPlaceRow : {})
                                }}
                            >
                                <div style={{
                                    ...styles.positionBox,
                                    ...(isFirst ? styles.firstPlaceBox : {})
                                }}>
                                    <span style={styles.position}>{rank}</span>
                                </div>
                                <div style={styles.driverInfo}>
                                    <div style={styles.driverName}>
                                        {(() => {
                                            const nameParts = player.username.trim().split(' ');
                                            if (nameParts.length > 1) {
                                                return `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`;
                                            }
                                            return player.username;
                                        })()}
                                    </div>
                                </div>
                                <div style={{
                                    ...styles.pointsBox,
                                    ...(isFirst ? styles.firstPlacePoints : {})
                                }}>
                                    {player.wins} Wins
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            <div style={styles.footer}>
                TOP 10
            </div>
        </div>
    );
};

// Styles copied/adapted from GrandPrixLeaderboard
const styles = {
    towerContainer: {
        width: '100%',
        maxWidth: '350px', // slightly wider than grand prix if needed, but keeping similar
        backgroundColor: '#111',
        border: '4px solid #333',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 0 20px rgba(0,0,0,0.5), 0 0 10px rgba(233, 69, 96, 0.2)',
        fontFamily: "'Roboto Condensed', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '600px', // arbitrary height limit
    },
    towerHeader: {
        backgroundColor: '#e94560',
        padding: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderBottom: '4px solid #fff'
    },
    flagIcon: {
        fontSize: '2rem'
    },
    titleContainer: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%'
    },
    titleRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    towerTitle: {
        margin: 0,
        color: '#fff',
        fontSize: '1.4rem',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        lineHeight: 1
    },
    weekLabel: {
        color: '#ffcbcb',
        fontSize: '0.7rem',
        fontWeight: 'bold',
        letterSpacing: '2px'
    },
    listContainer: {
        flex: 1,
        overflowY: 'auto',
        backgroundColor: '#1a1a2e',
        minHeight: '200px'
    },
    driverRow: {
        display: 'flex',
        alignItems: 'center',
        padding: '8px 10px',
        borderBottom: '1px solid #333',
        transition: 'background 0.2s',
        cursor: 'default'
    },
    firstPlaceRow: {
        backgroundColor: '#2d0a10'
    },
    positionBox: {
        width: '26px',
        height: '26px',
        backgroundColor: '#333',
        color: '#fff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '50%',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        marginRight: '10px'
    },
    firstPlaceBox: {
        backgroundColor: '#ffd700',
        color: '#000',
        boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
    },
    position: {
        lineHeight: 1
    },
    driverInfo: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1
    },
    driverName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '0.95rem'
    },
    driverStats: {
        color: '#888',
        fontSize: '0.75rem'
    },
    pointsBox: {
        backgroundColor: '#0f3460',
        color: '#fff',
        padding: '4px 8px',
        borderRadius: '4px',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        minWidth: '40px',
        textAlign: 'center'
    },
    firstPlacePoints: {
        backgroundColor: '#e94560',
        boxShadow: '0 0 8px rgba(233, 69, 96, 0.6)'
    },
    footer: {
        backgroundColor: '#111',
        padding: '10px',
        textAlign: 'center',
        color: '#555',
        fontSize: '0.8rem',
        borderTop: '1px solid #333'
    },
    loading: {
        padding: '20px',
        textAlign: 'center',
        color: '#888'
    },
    empty: {
        padding: '20px',
        textAlign: 'center',
        color: '#666'
    }
};

export default DailyWagerLeaderboard;
