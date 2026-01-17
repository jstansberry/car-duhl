'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import AdSense from './AdSense';

const GrandPrixLeaderboard = ({ initialLeaderboard }) => {
    const { user, openLoginModal } = useAuth();
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
                    .limit(20);

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
                        <div
                            style={styles.loginPrompt}
                            onClick={openLoginModal}
                        >
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
                    TOP 20
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
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        fontFamily: "'Roboto Condensed', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '800px'
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
        backgroundColor: '#FFFFFF'
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
        backgroundColor: '#F59E0B',
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
        backgroundColor: '#EFF6FF',
        color: '#2563EB',
        padding: '4px 8px',
        borderRadius: '6px',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        minWidth: '40px',
        textAlign: 'center'
    },
    firstPlacePoints: {
        backgroundColor: '#FFFFFF',
        color: '#D97706',
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
        backgroundColor: 'rgb(152, 233, 247)',
        color: '#000',
        textAlign: 'center',
        fontSize: '0.9rem',
        fontWeight: 'bold',
        cursor: 'pointer'
    },
    adContainer: {
        width: '280px',
        height: '250px',
        backgroundColor: '#F3F4F6', // Light gray placeholder
        border: '1px solid #E5E7EB',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#9CA3AF',
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
        color: '#D97706',
        marginLeft: '2px'
    }
};

export default GrandPrixLeaderboard;
