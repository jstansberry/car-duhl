'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const DailyWagerAdmin = () => {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    // Edit State
    const [editId, setEditId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        cover_image_url: '',
        source_url: '',
        auction_end_time: '',
        is_reserve: false,
        final_price: '',
        reserve_met: true
    });

    useEffect(() => {
        fetchAuctions();
    }, []);

    const fetchAuctions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('daily_wager_auctions')
                .select('*')
                .order('auction_end_time', { ascending: false });

            if (error) throw error;
            setAuctions(data || []);
        } catch (error) {
            console.error('Error fetching auctions:', error);
            alert('Failed to load auctions');
        } finally {
            setLoading(false);
        }
    };

    const calculateWinner = async (auctionId, finalPriceVal, isReserve, reserveMetVal) => {
        // Logic to find winner
        const finalP = parseFloat(finalPriceVal);
        let winnerId = null;
        let bestDiff = Infinity;
        let winningGuessPrice = null;

        // 1. Fetch all guesses for this auction
        const { data: guesses, error: guessesError } = await supabase
            .from('daily_wager_guesses')
            .select('*')
            .eq('auction_id', auctionId)
            .order('created_at', { ascending: true }); // Tie-breaker 1: Time

        if (guessesError) throw guessesError;

        guesses.forEach(guess => {
            // Reserve Logic
            if (isReserve) {
                // If user predicted "Reserve Not Met" (true)
                // AND the auction "Met Reserve" (true) -> Disqualified
                if (guess.reserve_not_met && reserveMetVal) return;

                // If user predicted "Reserve Met" (false/null)
                // AND the auction "Reserve Not Met" (false) -> Disqualified
                if (!guess.reserve_not_met && !reserveMetVal) return;
            }

            // Price Diff Logic
            const diff = Math.abs(parseFloat(guess.bid_amount) - finalP);
            if (diff < bestDiff) {
                bestDiff = diff;
                winnerId = guess.user_id;
                winningGuessPrice = parseFloat(guess.bid_amount);
            } else if (diff === bestDiff) {
                // Tie Logic
                if (winnerId) {
                    const currentWinnerVal = winningGuessPrice;
                    const candidateVal = parseFloat(guess.bid_amount);
                    // If candidate is lower than current winner, take candidate
                    if (candidateVal < currentWinnerVal) {
                        winnerId = guess.user_id;
                        winningGuessPrice = candidateVal;
                    }
                }
            }
        });

        return winnerId;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                title: formData.title,
                cover_image_url: formData.cover_image_url,
                source_url: formData.source_url,
                auction_end_time: new Date(formData.auction_end_time).toISOString(),
                is_reserve: formData.is_reserve,
            };

            // Settlement Logic if Final Price is provided
            if (formData.final_price) {
                payload.final_price = parseFloat(formData.final_price);
                payload.status = 'settled';
                if (formData.is_reserve) {
                    payload.reserve_met = formData.reserve_met;
                }

                // If we are editing, we know the ID. If creating, we get ID after insert (but we can't settle during create easily without ID).
                // Actually, if creating with a final price, we assume it's a historical import? 
                // But for calculation we need guesses. If it's new, there are no guesses.
                // So if "Create", winner is null.
                if (editId) {
                    const winnerId = await calculateWinner(editId, formData.final_price, formData.is_reserve, formData.reserve_met);
                    payload.winner_user_id = winnerId;
                } else {
                    // New auction, no guesses yet, so no winner.
                    payload.winner_user_id = null;
                }
            } else {
                // If clearing final price or creating without one
                // maybe reset status? Or keep as active?
                // payload.status = 'active'; 
                // Let's stick to 'active' if created, or preserve status if just editing title?
                // Simplest: if no final_price, status is 'active'.
                payload.status = 'active';
                payload.final_price = null;
                payload.winner_user_id = null;
                payload.reserve_met = null;
            }

            if (editId) {
                const { error } = await supabase
                    .from('daily_wager_auctions')
                    .update(payload)
                    .eq('id', editId);
                if (error) throw error;
                alert('Auction updated & settled (if price provided)!');
            } else {
                const { error } = await supabase
                    .from('daily_wager_auctions')
                    .insert([{ ...payload }]);
                if (error) throw error;
                alert('Auction created!');
            }

            resetForm();
            fetchAuctions();
        } catch (error) {
            console.error('Error saving auction:', error);
            alert(error.message);
        }
    };

    const resetForm = () => {
        setShowAddForm(false);
        setEditId(null);
        setFormData({
            title: '',
            cover_image_url: '',
            source_url: '',
            auction_end_time: '',
            is_reserve: false,
            final_price: '',
            reserve_met: true
        });
    };

    const handleEditClick = (item) => {
        // Adjust for local timezone to ensure input shows correct local time, not UTC
        const date = new Date(item.auction_end_time);
        const tzOffset = date.getTimezoneOffset() * 60000;
        const localISOTime = new Date(date - tzOffset).toISOString().slice(0, 16);

        setFormData({
            title: item.title,
            cover_image_url: item.cover_image_url,
            source_url: item.source_url,
            auction_end_time: localISOTime,
            is_reserve: item.is_reserve,
            final_price: item.final_price || '',
            reserve_met: item.reserve_met === false ? false : true
        });
        setEditId(item.id);
        setShowAddForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this auction?")) return;

        // 1. Delete dependent guesses first (manual cascade)
        const { error: guessError } = await supabase.from('daily_wager_guesses').delete().eq('auction_id', id);
        if (guessError) return alert("Error deleting guesses: " + guessError.message);

        // 2. Delete auction
        const { error } = await supabase.from('daily_wager_auctions').delete().eq('id', id);
        if (error) alert(error.message);
        else fetchAuctions();
    };

    return (
        <div className="glass-panel" style={{ padding: '20px' }}>
            <h2>Daily Wager Admin</h2>

            <button
                onClick={() => {
                    if (showAddForm) resetForm();
                    else setShowAddForm(true);
                }}
                style={{
                    marginBottom: '20px',
                    padding: '10px',
                    background: showAddForm ? '#666' : 'var(--primary-color)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                }}
            >
                {showAddForm ? 'Cancel' : '+ New Auction'}
            </button>

            {showAddForm && (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '8px' }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>{editId ? 'Edit Auction' : 'Create New Auction'}</h3>
                    <input
                        placeholder="Vehicle Title (e.g. 1990 Ferrari F40)"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        required
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#222', color: '#fff' }}
                    />
                    <input
                        placeholder="Cover Image URL"
                        value={formData.cover_image_url}
                        onChange={e => setFormData({ ...formData, cover_image_url: e.target.value })}
                        required
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#222', color: '#fff' }}
                    />
                    <input
                        placeholder="Source URL (Auction Link)"
                        value={formData.source_url}
                        onChange={e => setFormData({ ...formData, source_url: e.target.value })}
                        required
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#222', color: '#fff' }}
                    />
                    <label style={{ display: 'flex', flexDirection: 'column', color: '#000', fontSize: '0.9rem' }}>
                        Auction End Time
                        <input
                            type="datetime-local"
                            value={formData.auction_end_time}
                            onChange={e => setFormData({ ...formData, auction_end_time: e.target.value })}
                            required
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#222', color: '#fff', marginTop: '5px' }}
                        />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#000' }}>
                        <input
                            type="checkbox"
                            checked={formData.is_reserve}
                            onChange={e => setFormData({ ...formData, is_reserve: e.target.checked })}
                        />
                        Is Reserve Auction?
                    </label>

                    <div style={{ marginTop: '10px', borderTop: '1px solid #444', paddingTop: '10px' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#e94560' }}>Settlement (Optional)</h4>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <label style={{ display: 'flex', flexDirection: 'column', color: '#000', fontSize: '0.9rem' }}>
                                Final Price
                                <input
                                    type="number"
                                    placeholder="Leave empty if active"
                                    value={formData.final_price}
                                    onChange={e => setFormData({ ...formData, final_price: e.target.value })}
                                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#222', color: '#fff', marginTop: '5px' }}
                                />
                            </label>
                            {formData.is_reserve && (
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', marginTop: '20px' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.reserve_met}
                                        onChange={e => setFormData({ ...formData, reserve_met: e.target.checked })}
                                    />
                                    If Sold, was Reserve Met? (Checked = Yes / Sold)
                                </label>
                            )}
                        </div>
                    </div>

                    <button type="submit" style={{ padding: '10px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}>
                        {editId ? 'Update Auction' : 'Create Auction'}
                    </button>
                </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {auctions.map(item => (
                    <div key={item.id} style={{
                        border: '1px solid #444',
                        padding: '15px',
                        borderRadius: '8px',
                        background: 'rgba(0,0,0,0.2)',
                        display: 'flex',
                        gap: '20px',
                        alignItems: 'center'
                    }}>
                        <img src={item.cover_image_url} alt="cover" style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{item.title || 'Untitled'}</div>
                            <div style={{ fontWeight: 'bold' }}>Ends: {new Date(item.auction_end_time).toLocaleString()}</div>
                            <div style={{ fontSize: '0.9rem', color: '#000' }}>
                                Status: {item.status.toUpperCase()} |
                                Reserve: {item.is_reserve ? 'YES' : 'NO'}
                                {item.status === 'settled' && item.is_reserve && (
                                    <span style={{ color: item.reserve_met ? '#4CAF50' : '#e94560', marginLeft: '5px', fontWeight: 'bold' }}>
                                        ({item.reserve_met ? 'Met' : 'Not Met'})
                                    </span>
                                )}
                                | Winner: {item.winner_user_id ? 'Settled' : 'Pending'}
                            </div>
                            <a href={item.source_url} target="_blank" rel="noreferrer" style={{ color: '#4CAF50', fontSize: '0.8rem' }}>View Source</a>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <button
                                onClick={() => handleEditClick(item)}
                                style={{ padding: '5px 10px', background: '#FF9800', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(item.id)}
                                style={{ padding: '5px 10px', background: '#f44336', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DailyWagerAdmin;
