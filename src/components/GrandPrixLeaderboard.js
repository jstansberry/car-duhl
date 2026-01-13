'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import AdSense from './AdSense';

const GrandPrixLeaderboard = ({ initialLeaderboard }) => {
    const { user } = useAuth();
    const pathname = usePathname();
    const [leaders, setLeaders] = useState(initialLeaderboard || []);
    const [loading, setLoading] = useState(!initialLeaderboard);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const { data: leaderboardData, error: leaderboardError } = await supabase
                    .from('weekly_leaderboard')
                    .select('*')
                    .select('*')
                    .order('total_score', { ascending: false }) // Ensure sorted for ranking
                    .limit(10);

                if (leaderboardError) throw leaderboardError;

                setLeaders(leaderboardData || []);
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };

        if (!initialLeaderboard) {
            fetchLeaderboard();
        }

        // Refresh every minute
        const interval = setInterval(fetchLeaderboard, 60000);
        return () => clearInterval(interval);
    }, []);

    // Calculate Date Range (Monday - Sunday)
    const getWeekRange = () => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(d.setDate(diff));
        const sunday = new Date(new Date(monday).setDate(monday.getDate() + 6));

        const formatDate = (date) => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = months[date.getMonth()];
            const dayNum = date.getDate();

            // Ordinal suffix
            let suffix = 'th';
            if (dayNum % 10 === 1 && dayNum !== 11) suffix = 'st';
            else if (dayNum % 10 === 2 && dayNum !== 12) suffix = 'nd';
            else if (dayNum % 10 === 3 && dayNum !== 13) suffix = 'rd';

            return `${month} ${dayNum}${suffix}`;
        };

        return `${formatDate(monday)} - ${formatDate(sunday)}`;
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.towerContainer}>
                <div style={styles.towerHeader}>
                    <div style={styles.flagIcon}>🏁</div>
                    <div style={styles.titleContainer}>
                        <div style={styles.titleRow}>
                            <h3 style={styles.towerTitle}>GRAND PRIX</h3>
                        </div>
                        <span style={styles.weekLabel}>WEEKLY STANDINGS</span>
                        <span style={styles.weekLabel}>{getWeekRange()}</span>
                    </div>
                </div>

                <div style={styles.listContainer}>
                    {!user && (
                        <div style={styles.loginPrompt}>
                            Login to play!
                        </div>
                    )}
                    {loading ? (
                        <div style={styles.loading}>Pit Stop...</div>
                    ) : leaders.length === 0 ? (
                        <div style={styles.empty}>No drivers yet!</div>
                    ) : (
                        leaders.map((driver, index) => {
                            // Golf-style ranking: tied scores share the same rank
                            // Rank is determined by 1 + the number of people with a strictly higher score
                            // or simply the index of the first person with this score + 1 (since sorted).
                            const firstIndex = leaders.findIndex(l => l.total_score === driver.total_score);
                            const rank = firstIndex + 1;
                            const isFirst = rank === 1;

                            return (
                                <div
                                    key={driver.user_id}
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
                                            {driver.username || 'Anonymous'}
                                            {driver.grand_prix_wins > 0 && (
                                                <span title={`${driver.grand_prix_wins} time past Grand Prix winner`} style={styles.trophyIcon}>
                                                    🏆
                                                    {driver.grand_prix_wins > 1 && <span style={styles.winCount}>x{driver.grand_prix_wins}</span>}
                                                </span>
                                            )}
                                        </div>
                                        <div style={styles.driverStats}>
                                            {driver.games_played} Races
                                        </div>
                                    </div>
                                    <div style={{
                                        ...styles.pointsBox,
                                        ...(isFirst ? styles.firstPlacePoints : {})
                                    }}>
                                        {driver.total_score}
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

            {/* Ad Container with AdSense */}
            <div style={styles.adContainer}>
                <AdSense key={pathname} slot="1234567890" style={{ width: '100%', height: '100%' }} />
            </div>
        </div>
    );
};

const styles = {
    wrapper: {
        display: 'flex',
        flexDirection: 'column'

    },
    towerContainer: {
        width: '280px',
        backgroundColor: '#111',
        border: '4px solid #333',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 0 20px rgba(0,0,0,0.5), 0 0 10px rgba(233, 69, 96, 0.2)',
        fontFamily: "'Roboto Condensed', sans-serif", // Ideally use a condensed font
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '800px'
    },
    towerHeader: {
        backgroundColor: '#e94560', // Theme Red
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
        backgroundColor: '#1a1a2e'
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
        backgroundColor: '#2d0a10' // Dark red tint

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
        backgroundColor: '#ffd700', // Gold
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
    },
    loginPrompt: {
        padding: '10px',
        backgroundColor: '#e94560',
        color: '#fff',
        textAlign: 'center',
        fontSize: '0.9rem',
        fontWeight: 'bold'
    },
    adContainer: {
        width: '280px',
        height: '250px',
        backgroundColor: '#000',
        border: '1px solid #333',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#333',
        fontSize: '0.8rem',
        letterSpacing: '2px'
    },
    trophyIcon: {
        marginLeft: '6px',
        fontSize: '0.9rem',
        cursor: 'default'
    },
    winCount: {
        fontSize: '0.7rem',
        color: '#ffd700',
        marginLeft: '2px'
    }
};

export default GrandPrixLeaderboard;
