'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const DailyWagerAdmin = () => {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        cover_image_url: '',
        source_url: '',
        auction_end_time: '',
        is_reserve: false
    });

    // Settle State
    const [settleId, setSettleId] = useState(null);
    const [finalPrice, setFinalPrice] = useState('');

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

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('daily_wager_auctions')
                .insert([{
                    title: formData.title,
                    cover_image_url: formData.cover_image_url,
                    source_url: formData.source_url,
                    auction_end_time: new Date(formData.auction_end_time).toISOString(),
                    is_reserve: formData.is_reserve,
                    status: 'active'
                }]);

            if (error) throw error;

            alert('Auction created!');
            setShowAddForm(false);
            setFormData({
                title: '',
                cover_image_url: '',
                source_url: '',
                auction_end_time: '',
                is_reserve: false
            });
            fetchAuctions();
        } catch (error) {
            console.error('Error creating auction:', error);
            alert(error.message);
        }
    };

    const handleSettle = async (auctionId) => {
        if (!finalPrice) return alert("Enter a final price");

        try {
            // 1. Fetch all guesses for this auction
            const { data: guesses, error: guessesError } = await supabase
                .from('daily_wager_guesses')
                .select('*')
                .eq('auction_id', auctionId)
                .order('created_at', { ascending: true }); // Tie-breaker 1: Time

            if (guessesError) throw guessesError;

            // 2. Logic to find winner
            const finalP = parseFloat(finalPrice);
            let winnerId = null;
            let bestDiff = Infinity;
            let winningGuessPrice = null;

            // "Reserve Not Met" logic:
            // If the auction HAD a reserve (is_reserve = true) AND the final price was effectively "not met" logic?
            // Actually, the prompt says: "If a player has the winning wager BUT they chose the Reserve Not Met flag but the auction did meet the reserve, the next closest wager will win - ALL things have to be correct."
            // But how do we know if reserve was met? 
            // Usually in BaT auctions, if it sells, reserve was met. If it doesn't sell ("Reserve Not Met"), then the final price is the high bid.
            // The prompt implies WE (Admin) input the final price.
            // But wait, the user can toggle "Reserve Not Met". 
            // So if I input a final price, does that imply it sold?
            // "I will provide the final auction price in the admin."
            // I should probably also have a toggle in Admin Settle: "Reserve Met?" or "Sold?".
            // Let's assume for now, if I just input a price, it sold.
            // But I should properly add a toggle "Was Reserve Met?" to the Settle form to be precise.
            // Actually, usually "Reserve Not Met" is an outcome.

            // Let's add a "Result Status" to the settle form?
            // For simplicity, let's assume if the admin enters a price, that's the High Bid.
            // We need to know if the car actually SOLD or NOT (Reserve Met vs Not Met).
            // I'll adds a checkbox "Reserve Was Met (Sold)" to the settle form.

            // Wait, re-reading prompt: "If there is a guess above the final price that ties with a guess below the final price, the lower guess wins."
            // Simple absolute difference.

            // Re-reading logic: "If a player has the winning wager BUT they chose the Reserve Not Met flag but the auction did meet the reserve..."
            // So we definitely need to know if the auction met reserve.

            // Let's assume I need to pass `reserve_met` to the logic too.

            // I will implement a client-side calculation for now to keep it simple, 
            // but ideally this should be a server function to be secure. 
            // Given the tools, I'll do client-side calculation then update the DB.

            const wasReserveMet = window.confirm("Did the auction meet the reserve (i.e. was the car sold)?\nClick OK for YES (Sold).\nClick Cancel for NO (Reserve Not Met).");

            guesses.forEach(guess => {
                // If user predicted "Reserve Not Met" (true)
                // AND the auction "Met Reserve" (true) -> Disqualified (User was wrong about reserve)
                if (guess.reserve_not_met && wasReserveMet) return;

                // If user predicted "Reserve Met" (false/null)
                // AND the auction "Reserve Not Met" (false) -> Disqualified (User was wrong about reserve)
                if (!guess.reserve_not_met && !wasReserveMet) return;

                // If we are here, the user got the "Reserve Outcome" correct.
                // Now check price difference.
                // If the user predicted "Reserve Not Met", usually the price guess doesn't matter as much, 
                // OR maybe they still have to guess the high bid?
                // "The winning guess is the closest to the final auction bid"
                // So yes, price always matters.

                const diff = Math.abs(parseFloat(guess.bid_amount) - finalP);
                if (diff < bestDiff) {
                    bestDiff = diff;
                    winnerId = guess.user_id;
                    winningGuessPrice = parseFloat(guess.bid_amount);
                } else if (diff === bestDiff) {
                    // Tie Logic
                    // 1. "If a guess above... ties with a guess below... the lower guess wins"
                    // Current winner guess vs current candidate guess
                    // final=1000. winner=1100 (diff 100). candidate=900 (diff 100).
                    // candidate is lower (900 < 1100), so candidate wins.

                    // We need to store the current winner's bid to compare.
                    if (winnerId) {
                        const currentWinnerVal = winningGuessPrice;
                        const candidateVal = parseFloat(guess.bid_amount);

                        // If candidate is lower than current winner, take candidate
                        if (candidateVal < currentWinnerVal) {
                            winnerId = guess.user_id;
                            winningGuessPrice = candidateVal;
                        }
                        // Else if they are same value?
                        // "If there are 2 guesses that match, the winning guess is the one placed first."
                        // We sorted by created_at ascending, so the first one we processed is already the winner 
                        // and we shouldn't replace it unless strictly better.
                        // So we don't need to do anything here.
                    }
                }
            });

            // 3. Update Auction
            const { error: updateError } = await supabase
                .from('daily_wager_auctions')
                .update({
                    final_price: finalP,
                    winner_user_id: winnerId,
                    status: 'settled'
                    // We could store result metadata like 'reserve_met' if we added columns, but prompt didn't strictly ask.
                    // Storing just winner and price is enough for display.
                })
                .eq('id', auctionId);

            if (updateError) throw updateError;

            alert(`Auction Settled! Winner ID: ${winnerId || 'None'}`);
            setSettleId(null);
            setFinalPrice('');
            fetchAuctions();

        } catch (error) {
            console.error('Error settling:', error);
            alert(error.message);
        }
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
                onClick={() => setShowAddForm(!showAddForm)}
                style={{
                    marginBottom: '20px',
                    padding: '10px',
                    background: 'var(--primary-color)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                }}
            >
                {showAddForm ? 'Cancel' : '+ New Auction'}
            </button>

            {showAddForm && (
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '8px' }}>
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
                    <label style={{ display: 'flex', flexDirection: 'column', color: '#ccc', fontSize: '0.9rem' }}>
                        Auction End Time
                        <input
                            type="datetime-local"
                            value={formData.auction_end_time}
                            onChange={e => setFormData({ ...formData, auction_end_time: e.target.value })}
                            required
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#222', color: '#fff', marginTop: '5px' }}
                        />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                        <input
                            type="checkbox"
                            checked={formData.is_reserve}
                            onChange={e => setFormData({ ...formData, is_reserve: e.target.checked })}
                        />
                        Is Reserve Auction?
                    </label>
                    <button type="submit" style={{ padding: '10px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        Create Auction
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
                            <div style={{ fontSize: '0.9rem', color: '#aaa' }}>
                                Status: {item.status.toUpperCase()} |
                                Reserve: {item.is_reserve ? 'YES' : 'NO'} |
                                Winner: {item.winner_user_id ? 'Settled' : 'Pending'}
                            </div>
                            <a href={item.source_url} target="_blank" rel="noreferrer" style={{ color: '#4CAF50', fontSize: '0.8rem' }}>View Source</a>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {item.status === 'active' && (
                                <>
                                    {settleId === item.id ? (
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <input
                                                type="number"
                                                placeholder="Final Price"
                                                value={finalPrice}
                                                onChange={e => setFinalPrice(e.target.value)}
                                                style={{ width: '100px', padding: '5px' }}
                                            />
                                            <button onClick={() => handleSettle(item.id)} style={{ background: '#4CAF50', padding: '5px' }}>✅</button>
                                            <button onClick={() => setSettleId(null)} style={{ background: '#f44336', padding: '5px' }}>❌</button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setSettleId(item.id)}
                                            style={{ padding: '5px 10px', background: '#2196F3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Settle
                                        </button>
                                    )}
                                </>
                            )}
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
