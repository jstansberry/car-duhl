'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const GameSwitcher = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Determine current game based on path
    const currentGame = pathname === '/daily-wager' ? 'daily-wager' : 'grand-prix';

    const handleSelect = (game) => {
        setIsOpen(false);
        if (game === 'grand-prix') {
            router.push('/');
        } else if (game === 'daily-wager') {
            router.push('/daily-wager');
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
        return (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🏁</span> THE GRAND PRIX
            </span>
        );
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative', zIndex: 100 }}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '30px',
                    padding: '4px 7px',
                    color: '#fff',
                    fontFamily: "'Roboto Condensed', sans-serif",
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.3s ease',
                    boxShadow: isOpen ? '0 0 15px rgba(233, 69, 96, 0.4)' : 'none',
                    minWidth: '180px',
                    justifyContent: 'space-between'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                }}
            >
                {getCurrentLabel()}
                <span style={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                    fontSize: '0.8rem',
                    opacity: 0.7
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
                    background: 'rgba(20, 20, 30, 0.95)',
                    backdropFilter: 'blur(15px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    animation: 'slideDown 0.2s ease-out'
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
                            color: '#fff',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            background: currentGame === 'grand-prix' ? 'rgba(233, 69, 96, 0.2)' : 'transparent'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = currentGame === 'grand-prix' ? 'rgba(233, 69, 96, 0.2)' : 'transparent'}
                    >
                        <span style={{ fontSize: '1.2rem' }}>🏁</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>THE GRAND PRIX</span>
                            <span style={{ fontSize: '0.7rem', color: '#aaa' }}>Guess the car</span>
                        </div>
                    </div>

                    <div
                        onClick={() => handleSelect('daily-wager')}
                        style={{
                            padding: '12px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            color: '#fff',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <span style={{ fontSize: '1.2rem' }}>💰</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>THE DAILY WAGER</span>
                            <span style={{ fontSize: '0.7rem', color: '#aaa' }}>Guess the price</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameSwitcher;
