'use client';

import React, { useState, useEffect } from 'react';
// import { useChat } from '@ai-sdk/react'; // Removing to use custom fetch
import { supabase, supabaseUrl, supabaseAnonKey } from '../../lib/supabaseClient';


export default function DrivingBlindPage() {
    // Game State
    const [gameState, setGameState] = useState('playing'); // playing, won, lost
    const [gasTank, setGasTank] = useState(100); // 100% full
    const [solvedAttributes, setSolvedAttributes] = useState({ make: null, model: null, year: null });
    const MAX_TURNS = 12;



    // Manual Chat State Management
    const [messages, setMessages] = useState([
        { id: 'system-start', role: 'assistant', content: "THIS... is a mystery car! I'm sitting beside you in the passenger seat. You're blindfolded. Ask me anything about the vehicle you're in but not the make, model, or year!" }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    // Edge Function URL
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/driving-blind-chat`;

    const sendMessage = async (userMessage) => {
        setIsLoading(true);
        // Append user message immediately
        const msgsWithUser = [...messages, userMessage];
        setMessages(msgsWithUser);

        try {
            console.log("Fetching from:", edgeFunctionUrl);
            const response = await fetch(edgeFunctionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseAnonKey}`
                },
                body: JSON.stringify({ messages: msgsWithUser })
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            // Expecting JSON response from Edge Function
            const data = await response.json();

            // Append AI response
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: data.response
            }]);

            // Update Solved Attributes
            setSolvedAttributes(prev => {
                // Only update if changed to avoid unnecessary re-renders
                if (
                    prev.make === data.solved_make &&
                    prev.model === data.solved_model &&
                    prev.year === data.solved_year
                ) {
                    return prev;
                }

                const newState = { ...prev };
                if (data.solved_make) newState.make = data.solved_make;
                if (data.solved_model) newState.model = data.solved_model;
                if (data.solved_year) newState.year = data.solved_year;
                return newState;
            });

            // Check for win
            if (data.won) {
                setGameState('won');
                // You could trigger confetti here or other effects
            }

            // Callback logic for gas tank
            setGasTank(prev => Math.max(0, prev - (100 / MAX_TURNS)));

        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "Sorry, I stalled out! Try asking again."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const [input, setInput] = useState('');

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    const handleMessageSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const currentInput = input;
        setInput(''); // Clear immediately

        await sendMessage({ id: Date.now().toString(), role: 'user', content: currentInput });
    };

    const [isLoaded, setIsLoaded] = useState(false);

    // Load State from LocalStorage on mount
    useEffect(() => {
        try {
            const savedMessages = localStorage.getItem('driving-blind-messages');
            const savedGas = localStorage.getItem('driving-blind-gas');
            const savedDate = localStorage.getItem('driving-blind-date');
            const savedAttributes = localStorage.getItem('driving-blind-attributes');

            const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

            if (savedDate === today) {
                if (savedMessages) {
                    try {
                        const parsed = JSON.parse(savedMessages);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            setMessages(parsed);
                        }
                    } catch (e) {
                        console.error("Failed to parse saved messages", e);
                    }
                }
                if (savedGas) setGasTank(parseFloat(savedGas));
                if (savedAttributes) {
                    try {
                        const parsedAttrs = JSON.parse(savedAttributes);
                        setSolvedAttributes(parsedAttrs);
                    } catch (e) {
                        console.error("Failed to parse saved attributes", e);
                    }
                }
            } else {
                // New Day, Reset
                localStorage.setItem('driving-blind-date', today);
                // Clear state in LS
                localStorage.removeItem('driving-blind-messages');
                localStorage.removeItem('driving-blind-gas');
                localStorage.removeItem('driving-blind-attributes');

                // Reset State in Memory
                setMessages([
                    { id: 'system-start', role: 'assistant', content: "THIS... is a mystery car! I'm sitting beside you in the passenger seat. You're blindfolded. Ask me anything about the vehicle you're in but not the make, model, or year!" }
                ]);
                setGasTank(100);
                setSolvedAttributes({ make: null, model: null, year: null });
            }
        } catch (error) {
            console.error("LocalStorage Error:", error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Save State to LocalStorage on change
    useEffect(() => {
        // Only save if we have finished loading to prevent overwriting with initial state
        if (!isLoaded) return;

        if (messages.length > 0) {
            localStorage.setItem('driving-blind-messages', JSON.stringify(messages));
            localStorage.setItem('driving-blind-gas', gasTank.toString());
            localStorage.setItem('driving-blind-attributes', JSON.stringify(solvedAttributes));
        }
    }, [messages, gasTank, solvedAttributes, isLoaded]);



    const [revealedCar, setRevealedCar] = useState(null);

    // Fetch revealed car on Game Over
    useEffect(() => {
        if (gasTank <= 0 && !revealedCar) {
            const fetchReveal = async () => {
                try {
                    const response = await fetch(edgeFunctionUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${supabaseAnonKey}`
                        },
                        body: JSON.stringify({ reveal: true })
                    });
                    const data = await response.json();
                    if (data.car) {
                        setRevealedCar(data.car);
                    }
                } catch (error) {
                    console.error("Error fetching reveal:", error);
                }
            };
            fetchReveal();
        }
    }, [gasTank, revealedCar, edgeFunctionUrl]);


    // Auto-scroll ref
    const chatWindowRef = React.useRef(null);
    // Input ref
    const inputRef = React.useRef(null);

    // Auto-scroll effect
    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    // Auto-focus effect
    useEffect(() => {
        if (!isLoading && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isLoading]);

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2>DRIVING BLIND</h2>
                <p style={styles.subHeader}>Guess the car before you run out of gas!</p>
            </div>

            {/* Chat Area */}
            <div style={styles.chatWindow} ref={chatWindowRef}>
                {messages.map(m => (
                    <div key={m.id} style={{
                        ...styles.messageRow,
                        justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'
                    }}>
                        <div style={{
                            ...styles.bubble,
                            backgroundColor: m.role === 'user' ? '#2563EB' : '#F3F4F6',
                            color: m.role === 'user' ? 'white' : '#1F2937',
                            borderBottomRightRadius: m.role === 'user' ? 0 : 18,
                            borderBottomLeftRadius: m.role === 'assistant' ? 0 : 18,
                        }}>
                            {/* Filter out JSON artifacts if any slipped through legacy state */}
                            {m.role === 'assistant' && <span style={styles.avatar}>🚙 </span>}
                            {typeof m.content === 'object' ? m.content.response : m.content}
                        </div>
                    </div>
                ))}
                {isLoading && <div style={styles.loading}>I'm thinking...</div>}
            </div>

            {/* Input Area / Victory Area */}
            <div style={styles.inputArea}>
                {gameState === 'won' ? (
                    <div style={styles.victory}>
                        <h3>VICTORY!</h3>
                        <p style={{ color: 'black' }}>You correctly guessed the car!</p>
                    </div>
                ) : gameState === 'playing' && gasTank > 0 ? (
                    <form onSubmit={(e) => {
                        if ((input || '').length > 150) {
                            e.preventDefault();
                            alert("Keep it short! Under 150 chars.");
                            return;
                        }
                        handleMessageSubmit(e);
                    }} style={styles.chatForm}>
                        <input
                            ref={inputRef}
                            className="chat-input"
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Ask about the car..."
                            maxLength={150}
                            style={styles.textInput}
                            disabled={isLoading}
                        />
                        <button type="submit" style={styles.sendButton} disabled={isLoading || !input.trim()}>
                            SEND
                        </button>
                    </form>
                ) : (
                    <div style={styles.gameOver}>
                        <h3>OUT OF GAS!</h3>
                        {revealedCar && (
                            <p>The car was a {revealedCar.year} {revealedCar.make} {revealedCar.model}</p>
                        )}
                    </div>
                )}
            </div>

            {/* Gas Gauge */}
            <div style={styles.gaugeContainer}>
                <div style={styles.gaugeLabel}>GAS TANK</div>
                <div style={styles.gaugeBar}>
                    <div style={{ ...styles.gaugeFill, width: `${gasTank}%`, backgroundColor: gasTank < 20 ? 'red' : '#4caf50' }} />
                </div>
            </div>

            {/* Progress Badges */}
            <div style={styles.badgesContainer}>
                <div style={{ ...styles.badge, borderColor: solvedAttributes.year ? '#2563EB' : '#E5E7EB' }}>
                    <div style={styles.badgeLabel}>YEAR</div>
                    <div style={styles.badgeValue}>{solvedAttributes.year || '???'}</div>
                </div>
                <div style={{ ...styles.badge, borderColor: solvedAttributes.make ? '#2563EB' : '#E5E7EB' }}>
                    <div style={styles.badgeLabel}>MAKE</div>
                    <div style={styles.badgeValue}>{solvedAttributes.make || '???'}</div>
                </div>
                <div style={{ ...styles.badge, borderColor: solvedAttributes.model ? '#2563EB' : '#E5E7EB' }}>
                    <div style={styles.badgeLabel}>MODEL</div>
                    <div style={styles.badgeValue}>{solvedAttributes.model || '???'}</div>
                </div>
            </div>
        </div>
    );

}

const styles = {
    container: {
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Inter, sans-serif',
        color: 'white',
        minHeight: '100vh',
    },
    header: {
        textAlign: 'center',
        marginBottom: '20px',
    },
    subHeader: {
        margin: 0,
        opacity: 0.7,
        fontStyle: 'italic',
    },
    gaugeContainer: {
        marginBottom: '15px',
        background: '#222',
        padding: '10px',
        borderRadius: '8px',
    },
    gaugeLabel: {
        fontSize: '0.8rem',
        fontWeight: 'bold',
        marginBottom: '5px',
        color: '#aaa',
    },
    gaugeBar: {
        height: '10px',
        background: '#444',
        borderRadius: '5px',
        overflow: 'hidden',
    },
    gaugeFill: {
        height: '100%',
        transition: 'width 0.5s ease',
    },
    chatWindow: {
        height: '400px',
        overflowY: 'auto',
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        border: '1px solid #E5E7EB',
        boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
    },
    messageRow: {
        display: 'flex',
        marginBottom: '15px',
    },
    bubble: {
        padding: '12px 18px',
        borderRadius: '18px',
        maxWidth: '80%',
        lineHeight: '1.5',
        fontSize: '1rem',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    avatar: {
        marginRight: '8px',
    },
    inputArea: {
        marginBottom: '30px',
    },
    chatForm: {
        display: 'flex',
        gap: '12px',
    },
    textInput: {
        flex: 1,
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #E5E7EB',
        background: '#FFFFFF',
        color: '#1F2937',
        fontSize: '1rem',
    },
    sendButton: {
        padding: '0 24px',
        borderRadius: '8px',
        border: 'none',
        background: '#2563EB',
        color: 'white',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    loading: {
        textAlign: 'center',
        opacity: 0.6,
        fontSize: '0.875rem',
        marginTop: '10px',
        color: '#6B7280',
    },
    guessSection: {
        marginTop: '20px',
        borderTop: '1px solid #E5E7EB',
        paddingTop: '20px',
    },
    victory: {
        textAlign: 'center',
        padding: '20px',
        background: '#D1FAE5', /* Soft Green */
        borderRadius: '12px',
        fontWeight: 'bold',
        color: '#065F46',
        border: '1px solid #A7F3D0',
    },

    gameOver: {
        textAlign: 'center',
        padding: '20px',
        background: '#FEE2E2', /* Soft Red */
        borderRadius: '12px',
        fontWeight: 'bold',
        color: '#991B1B',
        border: '1px solid #FECACA',
    },
    badgesContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px',
        width: '100%',
        marginTop: '20px',
    },
    badge: {
        flex: 1,
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '12px',
        textAlign: 'center',
        background: '#FFFFFF',
        transition: 'all 0.3s ease',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    badgeLabel: {
        fontSize: '0.75rem',
        color: '#6B7280',
        fontWeight: 'bold',
        marginBottom: '4px',
        textTransform: 'uppercase',
    },
    badgeValue: {
        fontSize: '1rem',
        fontWeight: 'bold',
        color: '#1F2937',
    },

};
