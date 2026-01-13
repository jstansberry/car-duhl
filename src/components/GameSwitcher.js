'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';

const GameSwitcher = () => {
    const router = useRouter();
    const pathname = usePathname();

    // Determine current game based on path
    const currentGame = pathname === '/daily-wager' ? 'daily-wager' : 'grand-prix';

    const handleGameChange = (e) => {
        const selectedGame = e.target.value;
        if (selectedGame === 'grand-prix') {
            router.push('/');
        } else if (selectedGame === 'daily-wager') {
            router.push('/daily-wager');
        }
    };

    return (
        <div className="game-switcher-container">
            <select
                value={currentGame}
                onChange={handleGameChange}
                className="game-switcher-select"
            >
                <option value="grand-prix">The Grand Prix</option>
                <option value="daily-wager">The Daily Wager</option>
            </select>
            {/* Custom arrow/styling wrapper if needed, but select with class is easier for mobile native behavior */}
        </div>
    );
};

export default GameSwitcher;
