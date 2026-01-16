'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const GameSwitcher = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Determine current game based on path
    let currentGame = 'grand-prix';
    if (pathname === '/daily-wager') currentGame = 'daily-wager';
    if (pathname === '/driving-blind') currentGame = 'driving-blind';

    const handleSelect = (game) => {
        setIsOpen(false);
        if (game === 'grand-prix') {
            router.push('/');
        } else if (game === 'daily-wager') {
            router.push('/daily-wager');
        } else if (game === 'driving-blind') {
            router.push('/driving-blind');
        }
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getCurrentLabel = () => {
        if (currentGame === 'daily-wager') return (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>💰</span> THE DAILY WAGER
            </span>
        );
        if (currentGame === 'driving-blind') return (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>😎</span> DRIVING BLIND
            </span>
        );
        return (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🏁</span> THE GRAND PRIX
            </span>
        );
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative', zIndex: 100 }}>
            {/* Trigger Button */}
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: '#222',
                    border: '1px solid #444',
                    borderRadius: '30px',
                    padding: '6px 14px',
                    color: '#FFFFFF',
                    fontFamily: "'Roboto Condensed', sans-serif",
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    minWidth: '180px',
                    justifyContent: 'space-between'
                }}
            >
                {getCurrentLabel()}
                <span style={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                    fontSize: '0.8rem',
                    opacity: 0.7,
                    color: '#CCCCCC'
                }}>
                    ▼
                </span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '120%',
                    right: 0,
                    width: '100%',
                    minWidth: '220px',
                    background: '#1a1a1a', /* Dark bg */
                    border: '1px solid #333',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                    animation: 'slideDown 0.2s ease-out',
                    zIndex: 101,
                }}>
                    <style>
                        {`
                        @keyframes slideDown {
                            from { opacity: 0; transform: translateY(-10px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                        `}
                    </style>

                    <div
                        onClick={() => handleSelect('grand-prix')}
                        style={{
                            padding: '12px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            color: '#FFFFFF',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            borderBottom: '1px solid #333',
                            background: currentGame === 'grand-prix' ? '#333' : 'transparent'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
                        onMouseLeave={(e) => e.currentTarget.style.background = currentGame === 'grand-prix' ? '#333' : 'transparent'}
                    >
                        <span style={{ fontSize: '1.2rem' }}>🏁</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>THE GRAND PRIX</span>
                            <span style={{ fontSize: '0.7rem', color: '#999' }}>Guess the car</span>
                        </div>
                    </div>

                    <div
                        onClick={() => handleSelect('driving-blind')}
                        style={{
                            padding: '12px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            color: '#FFFFFF',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            borderBottom: '1px solid #333',
                            background: currentGame === 'driving-blind' ? '#333' : 'transparent'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
                        onMouseLeave={(e) => e.currentTarget.style.background = currentGame === 'driving-blind' ? '#333' : 'transparent'}
                    >
                        <span style={{ fontSize: '1.2rem' }}>😎</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>DRIVING BLIND</span>
                            <span style={{ fontSize: '0.7rem', color: '#999' }}>Explore mystery car</span>
                        </div>
                    </div>

                    <div
                        onClick={() => handleSelect('daily-wager')}
                        style={{
                            padding: '12px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            color: '#FFFFFF',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <span style={{ fontSize: '1.2rem' }}>💰</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>THE DAILY WAGER</span>
                            <span style={{ fontSize: '0.7rem', color: '#999' }}>Guess the price</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameSwitcher;
