'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const DailyWagerCard = React.memo(({ auction, userGuessId, initialGuess, winnerData, onGuessSubmit }) => {
    const { user } = useAuth();

    // Timer State
    const [timeLeft, setTimeLeft] = useState('');
    const [isLocked, setIsLocked] = useState(false);
    const [isEnded, setIsEnded] = useState(false);

    // Form State
    const [bidAmount, setBidAmount] = useState(initialGuess?.bid_amount || '');
    // Logic: reserveNotMet = true means "Reserve Not Met" (No Sale)
    // UI: "Meets Reserve?" -> Yes (Sold, reserveNotMet=false) | No (Not Sold, reserveNotMet=true)
    const [reserveNotMet, setReserveNotMet] = useState(initialGuess?.reserve_not_met ?? false);
    const [submitting, setSubmitting] = useState(false);



    // Update bid amount if initial guess changes (e.g. after fresh fetch)
    useEffect(() => {
        if (initialGuess) {
            setBidAmount(initialGuess.bid_amount);
            setReserveNotMet(initialGuess.reserve_not_met);
        }
    }, [initialGuess]);

    useEffect(() => {
        // Timer Logic
        const calculateTime = () => {
            const now = new Date();
            const end = new Date(auction.auction_end_time);
            const diff = end - now;

            if (diff <= 0 || auction.status === 'settled') {
                setIsEnded(true);
                setIsLocked(true);
                setTimeLeft("Auction Ended");
                return true; // Return signal to clear interval
            }

            const fortyEightHoursMs = 48 * 60 * 60 * 1000;

            // Format time display
            // "if the auction expiration time is more than 48 hrs, just say, e.g. '3 days' instead of the exact timestamp"
            // Wait, does "expiration time" mean total time left? Yes.
            // If diff > 48h ...
            // Also need to check lock state.

            if (diff < fortyEightHoursMs) {
                // < 48h left -> LOCKED.
                setIsLocked(true);
                // "a countdown timer ticking backwards that represents how much time before the auction ends"
                setTimeLeft(`Bidding Closed. Ends in ${formatDuration(diff)}`);
            } else {
                // > 48h left -> OPEN.
                setIsLocked(false);
                // "a countdown timer ticking backwards that represents how much time a user has left to place a daily wager"
                // Time left to wager = diff - 48h.
                const timeToWager = diff - fortyEightHoursMs;

                // If the total time left is significantly huge (e.g. > 72h), maybe simplify? 
                // Requests: "just say, e.g. '3 days' instead of the exact timestamp" if exp > 48h.
                // The prompt was "if the auction expiration time is more than 48 hrs".
                // I will use a simplified display for the "Time Left to Wager" if it's large.

                setTimeLeft(`${formatDuration(timeToWager)} left to wager`);
            }
        };

        const shouldStop = calculateTime();
        if (shouldStop) return;

        const interval = setInterval(() => {
            const stop = calculateTime();
            if (stop) clearInterval(interval);
        }, 1000);

        return () => clearInterval(interval);
    }, [auction.auction_end_time, auction.status]);



    const formatDuration = (ms) => {
        if (ms < 0) ms = 0;
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const seconds = Math.floor((ms / 1000) % 60);

        // Friendly format if > 2 days (approx 48h)
        // If days >= 2, show "X days"
        // But the requirement says "if the auction expiration time is more than 48 hrs".
        // This function formats "time left".

        if (days >= 2) return `${days} days`;
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    };

    const handleSubmit = async () => {
        if (!user) return alert("Please login to play");
        setSubmitting(true);
        try {
            const payload = {
                user_id: user.id,
                auction_id: auction.id,
                bid_amount: bidAmount,
                reserve_not_met: reserveNotMet,
                updated_at: new Date().toISOString()
            };

            let error;
            if (initialGuess) {
                const { error: upError } = await supabase
                    .from('daily_wager_guesses')
                    .update(payload)
                    .eq('id', initialGuess.id);
                error = upError;
            } else {
                const { error: inError } = await supabase
                    .from('daily_wager_guesses')
                    .insert([payload]);
                error = inError;
            }

            if (error) throw error;

            alert("Wager placed!");
            onGuessSubmit(); // Refresh parent to get new ID
        } catch (error) {
            console.error(error);
            alert("Failed to place wager: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (val) => {
        if (!val && val !== 0) return '$0';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    };

    // Calculate background gradient dynamically if needed, or static

    return (
        <div className="glass-panel" style={{
            display: 'flex',
            marginBottom: '20px',
            overflow: 'hidden',
            flexWrap: 'wrap',
            background: 'rgba(20,20,30,0.6)'
        }}>
            {/* Left: Cover Image */}
            <div style={{ flex: '1 1 300px', minHeight: '200px', position: 'relative' }}>
                <a href={auction.source_url} target="_blank" rel="noreferrer" style={{ display: 'block', height: '100%' }}>
                    <img
                        src={auction.cover_image_url}
                        alt={auction.title || "Auction Car"}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                        decoding="async"
                    />
                </a>
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    padding: '5px 10px',
                    borderRadius: '4px',
                    fontSize: '0.8rem'
                }}>
                    {timeLeft}
                </div>
            </div>

            {/* Right: Game Controls */}
            <div style={{ flex: '1 1 400px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, color: '#e94560', fontSize: '1.4rem' }}>
                        {auction.title || 'Make Your Wager'}
                    </h3>
                    {!auction.is_reserve && (
                        <span style={{
                            background: '#FFD700',
                            color: '#000',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                        }}>
                            No Reserve
                        </span>
                    )}
                </div>

                {/* Result Display if Settled */}
                {auction.status === 'settled' && (
                    <div style={{
                        background: 'linear-gradient(45deg, #FFD70033, transparent)',
                        border: '1px solid #FFD700',
                        padding: '10px',
                        borderRadius: '8px',
                        marginBottom: '10px'
                    }}>
                        <strong>WINNER:</strong> {winnerData?.winner_name ? (() => {
                            const nameParts = winnerData.winner_name.trim().split(' ');
                            if (nameParts.length > 1) {
                                return `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`;
                            }
                            return winnerData.winner_name;
                        })() : 'Unknown'} <br />
                        <strong>Winning Guess:</strong> {formatCurrency(winnerData?.winning_bid)} <br />
                        <span style={{ fontSize: '0.9rem', color: '#aaa' }}>
                            (Final Bid: {formatCurrency(auction.final_price)})
                        </span>
                        {auction.status === 'settled' && auction.is_reserve && (
                            <div style={{ marginTop: '5px', fontSize: '0.9rem', fontWeight: 'bold', color: auction.reserve_met ? '#4CAF50' : '#e94560' }}>
                                {auction.reserve_met ? "RESERVE MET (SOLD)" : "RESERVE NOT MET (NOT SOLD)"}
                            </div>
                        )}
                    </div>
                )}

                <a href={auction.source_url} target="_blank" rel="noreferrer" style={{ color: '#4CAF50', textDecoration: 'underline' }}>
                    View Auction Source
                </a>

                {/* Reserve Controls (Hide if No Reserve) */}
                {auction.is_reserve && (
                    <div style={{
                        background: '#2a2a2a',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <span style={{ color: '#ccc', fontWeight: 'bold' }}>Meets Reserve?</span>
                        <div style={{ display: 'flex', background: '#111', borderRadius: '4px', padding: '2px' }}>
                            <button
                                onClick={() => !isLocked && setReserveNotMet(false)} // Yes = reserve met (false)
                                disabled={isLocked}
                                style={{
                                    background: !reserveNotMet ? '#4CAF50' : 'transparent',
                                    color: !reserveNotMet ? '#fff' : '#888',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '5px 15px',
                                    cursor: isLocked ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s',
                                    margin: '5px'
                                }}
                            >
                                YES
                            </button>
                            <button
                                onClick={() => !isLocked && setReserveNotMet(true)} // No = reserve NOT met (true)
                                disabled={isLocked}
                                style={{
                                    background: reserveNotMet ? '#e94560' : 'transparent',
                                    color: reserveNotMet ? '#fff' : '#888',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '5px 15px',
                                    cursor: isLocked ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s',
                                    margin: '5px'
                                }}
                            >
                                NO
                            </button>
                        </div>
                    </div>
                )}

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#ccc' }}>
                        Final Bid Guess ($):
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                        <div style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            width: '150px'
                        }}>
                            <span style={{
                                position: 'absolute',
                                left: '10px',
                                color: '#e94560',
                                fontSize: '1.2rem',
                                fontWeight: 'bold'
                            }}>$</span>
                            <input
                                type="number"
                                min="0"
                                value={bidAmount}
                                onChange={(e) => setBidAmount(e.target.value)}
                                disabled={isLocked}
                                placeholder="0"
                                style={{
                                    width: '100%',
                                    padding: '10px 10px 10px 25px',
                                    background: '#222',
                                    border: '1px solid #444',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '1.2rem',
                                    outline: 'none',
                                    fontWeight: 'bold'
                                }}
                            />
                        </div>

                        {initialGuess && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Guess made on
                                </span>
                                <span style={{ fontSize: '0.9rem', color: '#ccc', fontWeight: 'bold' }}>
                                    {new Date(initialGuess.updated_at || initialGuess.created_at).toLocaleString('en-US', {
                                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {!isLocked ? (
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        style={{
                            background: 'var(--primary-color)',
                            color: '#fff',
                            border: 'none',
                            padding: '12px',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: submitting ? 'wait' : 'pointer',
                            marginTop: 'auto'
                        }}
                    >
                        {submitting ? 'Placing...' : (initialGuess ? 'Update Wager' : 'Place Wager')}
                    </button>
                ) : (
                    <div style={{
                        marginTop: 'auto',
                        textAlign: 'center',
                        padding: '10px',
                        background: '#333',
                        color: '#aaa',
                        borderRadius: '8px'
                    }}>
                        Wagering Locked
                    </div>
                )}
            </div>
        </div>
    );
});

export default DailyWagerCard;
