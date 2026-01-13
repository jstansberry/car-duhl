'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import DailyWagerCard from '../../components/DailyWagerCard';
import DailyWagerLeaderboard from '../../components/DailyWagerLeaderboard';

const DailyWagerPage = () => {
    const { user } = useAuth();
    const [auctions, setAuctions] = useState([]);
    const [userGuesses, setUserGuesses] = useState({});
    const [resultsMap, setResultsMap] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchAuctions = async () => {
        setLoading(true);
        try {
            // 1. Fetch Active or Recently Settled Auctions
            const { data: aucData, error: aucError } = await supabase
                .from('daily_wager_auctions')
                .select('*')
                .order('auction_end_time', { ascending: true });

            if (aucError) throw aucError;

            const fetchedAuctions = aucData || [];
            setAuctions(fetchedAuctions);

            const aucIds = fetchedAuctions.map(a => a.id);

            // 2. Fetch Results for settled auctions
            if (aucIds.length > 0) {
                const { data: resData, error: resError } = await supabase
                    .from('daily_wager_results_view')
                    .select('*')
                    .in('auction_id', aucIds);

                if (resError) throw resError;

                const rMap = {};
                if (resData) {
                    resData.forEach(r => {
                        rMap[r.auction_id] = r;
                    });
                }
                setResultsMap(rMap);
            }
        } catch (error) {
            console.error("Error loading auctions:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserGuesses = async () => {
        if (!user || auctions.length === 0) return;

        try {
            const aucIds = auctions.map(a => a.id);
            const { data: guessData, error: guessError } = await supabase
                .from('daily_wager_guesses')
                .select('*')
                .eq('user_id', user.id)
                .in('auction_id', aucIds);

            if (guessError) throw guessError;

            const guessMap = {};
            guessData.forEach(g => {
                guessMap[g.auction_id] = g;
            });
            setUserGuesses(guessMap);
        } catch (error) {
            console.error("Error loading guesses:", error);
        }
    };

    // Load auctions once on mount
    useEffect(() => {
        fetchAuctions();
    }, []);

    // Load guesses when user or auctions change
    useEffect(() => {
        fetchUserGuesses();
    }, [user, auctions]);

    const handleGuessSubmit = () => {
        fetchUserGuesses();
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '40px', fontSize: '2.5rem' }}>The Daily Wager</h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
                {/* Main Column: Auctions */}
                <div style={{ flex: '1 1 600px' }}>
                    {loading && <p style={{ textAlign: 'center' }}>Loading Auctions...</p>}
                    {!loading && auctions.length === 0 && <p style={{ textAlign: 'center' }}>No active auctions right now.</p>}

                    {auctions.map(auction => (
                        <DailyWagerCard
                            key={auction.id}
                            auction={auction}
                            userGuessId={userGuesses[auction.id]?.id}
                            initialGuess={userGuesses[auction.id]}
                            winnerData={resultsMap[auction.id]}
                            onGuessSubmit={handleGuessSubmit}
                        />
                    ))}
                </div>

                {/* Sidebar: Leaderboard */}
                <div style={{ flex: '0 0 320px' }}>
                    <DailyWagerLeaderboard />
                </div>
            </div>
        </div>
    );
};

export default DailyWagerPage;
