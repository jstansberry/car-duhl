'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const DailyWagerLeaderboard = () => {
    const { user, openLoginModal } = useAuth();
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
                {!user && (
                    <div
                        style={styles.loginPrompt}
                        onClick={openLoginModal}
                    >
                        Login to play!
                    </div>
                )}
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
        maxWidth: '350px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        fontFamily: "'Roboto Condensed', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '600px',
    },
    towerHeader: {
        backgroundColor: '#2563EB',
        padding: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderBottom: '1px solid #1D4ED8'
    },
    flagIcon: {
        fontSize: '2rem',
        color: '#FFFFFF'
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
        color: '#FFFFFF',
        fontSize: '1.4rem',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        lineHeight: 1
    },
    weekLabel: {
        color: '#DBEAFE', // Light Blue
        fontSize: '0.75rem',
        fontWeight: 'bold',
        letterSpacing: '1px'
    },
    listContainer: {
        flex: 1,
        overflowY: 'auto',
        backgroundColor: '#FFFFFF',
        minHeight: '200px'
    },
    driverRow: {
        display: 'flex',
        alignItems: 'center',
        padding: '10px 15px',
        borderBottom: '1px solid #F3F4F6',
        transition: 'background 0.2s',
        cursor: 'default'
    },
    firstPlaceRow: {
        backgroundColor: '#FEF3C7' // Soft Gold
    },
    positionBox: {
        width: '24px',
        height: '24px',
        backgroundColor: '#F3F4F6',
        color: '#6B7280',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '50%',
        fontWeight: 'bold',
        fontSize: '0.85rem',
        marginRight: '12px'
    },
    firstPlaceBox: {
        backgroundColor: '#F59E0B', // Darker Gold
        color: '#FFFFFF',
        boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
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
        color: '#1F2937',
        fontWeight: 'bold',
        fontSize: '0.95rem'
    },
    driverStats: {
        color: '#9CA3AF',
        fontSize: '0.75rem'
    },
    pointsBox: {
        backgroundColor: '#EFF6FF', // Light Blue
        color: '#2563EB', // Royal Blue
        padding: '4px 8px',
        borderRadius: '6px',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        minWidth: '40px',
        textAlign: 'center'
    },
    firstPlacePoints: {
        backgroundColor: '#FFFFFF',
        color: '#D97706', // Dark Gold text
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    },
    footer: {
        backgroundColor: '#F9FAFB',
        padding: '10px',
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: '0.75rem',
        borderTop: '1px solid #E5E7EB',
        fontWeight: '500'
    },
    loading: {
        padding: '20px',
        textAlign: 'center',
        color: '#6B7280'
    },
    empty: {
        padding: '20px',
        textAlign: 'center',
        color: '#9CA3AF'
    },
    loginPrompt: {
        padding: '10px',
        backgroundColor: 'rgb(152 233 247)',
        color: '#000',
        textAlign: 'center',
        fontSize: '0.9rem',
        fontWeight: 'bold',
        cursor: 'pointer'
    }
};

export default DailyWagerLeaderboard;
