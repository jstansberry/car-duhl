'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import DailyWagerCard from './DailyWagerCard';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

const DailyWagerList = ({ initialAuctions, initialResults }) => {
    const { user } = useAuth();
    const [auctions] = useState(() => {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const cutoffString = threeDaysAgo.toISOString().split('T')[0];

        return initialAuctions.filter(a => {
            // Keep if NOT settled OR (settled AND date >= 3 days ago)
            // Assuming 'status' field or date comparison. 
            // If we rely purely on date:
            if (a.status === 'settled' || new Date(a.date) < threeDaysAgo) {
                // But wait, upcoming auctions are fine. 
                // The request is "hide cars that have settled more than 3 days ago".
                // So if status is settled AND date is old, hide it.
                // Let's assume date is the auction date.
                if (a.date < cutoffString && (a.status === 'settled' || a.status === 'closed')) {
                    return false;
                }
            }
            return true;
        });
    });
    const [userGuesses, setUserGuesses] = useState({});

    // We can fetch guesses on mount just like before, or pass them if we SSR'd them (but user auth is tricky on server for initial render if using static gen, 
    // but assuming dynamic rendering for page.js, we passed what we could. 
    // Actually, `useAuth` handles the client side user. Let's fetch guesses here to be safe and reactive.)

    const fetchUserGuesses = useCallback(async () => {
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
    }, [user, auctions]);

    useEffect(() => {
        fetchUserGuesses();
    }, [fetchUserGuesses]);

    const handleGuessSubmit = useCallback(() => {
        fetchUserGuesses();
    }, [fetchUserGuesses]);

    // Row renderer for react-window
    const Row = ({ index, style }) => {
        const auction = auctions[index];
        // Add some padding/margin to the style. react-window positions absolutely.
        // We need to account for spacing. simpler to use a wrapper div.
        const rowStyle = {
            ...style,
            top: `${parseFloat(style.top) + 10}px`, // Add slight top buffer if needed, or better, just handle spacing inside the component via height logic
            height: `${parseFloat(style.height) - 20}px`, // Subtract gap from height
            left: style.left,
            width: style.width,
            paddingBottom: '20px' // purely visual gap
        };

        // Actually, better pattern for spacing in FixedSizeList:
        // Set itemSize to (componentHeight + gap)
        // Then render component with specific height or let it fill.

        return (
            <div style={style}>
                {/* Inner wrapper for spacing */}
                <div style={{ height: '95%', marginBottom: '5%' }}>
                    <DailyWagerCard
                        auction={auction}
                        userGuessId={userGuesses[auction.id]?.id}
                        initialGuess={userGuesses[auction.id]}
                        winnerData={initialResults[auction.id]}
                        onGuessSubmit={handleGuessSubmit}
                    />
                </div>
            </div>
        );
    };

    if (auctions.length === 0) {
        return <p style={{ textAlign: 'center' }}>No active auctions right now.</p>;
    }

    return (
        <div style={{ flex: '1 1 600px', height: '800px', minHeight: '500px' }}>
            {/* 
                AutoSizer fills the parent. 
                Parent needs a height. 
                We can try to make it flexible or fixed. 
                For now, a fixed height container that scrolls is safer than window scrolling for list virtualization 
                unless we use `window-scroller` which is complex. 
                Let's set a reasonable height or use flex-grow if the layout allows.
                The previous layout had it in a flex column.
            */}
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        height={height}
                        itemCount={auctions.length}
                        itemSize={450} // Estimate height of card + gap. Card is ~400px? Need to check.
                        width={width}
                    >
                        {Row}
                    </List>
                )}
            </AutoSizer>
        </div>
    );
};

export default DailyWagerList;
