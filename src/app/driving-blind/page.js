'use client';

import React, { useState, useEffect } from 'react';
// import { useChat } from '@ai-sdk/react'; // Removing to use custom fetch
import { supabase, supabaseUrl, supabaseAnonKey } from '../../lib/supabaseClient';


export default function DrivingBlindPage() {
    // Game State
    const [gameState, setGameState] = useState('playing'); // playing, won, lost
    const [gasTank, setGasTank] = useState(100); // 100% full
    const MAX_TURNS = 12;



    // Manual Chat State Management
    const [messages, setMessages] = useState([
        { id: 'system-start', role: 'assistant', content: "THIS... is a mystery car! I'm sitting right here next to you in the passenger seat. You're blindfolded. Ask me anything about the vehicle you're in but not the make, model, or year!" }
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

    // Load State from LocalStorage on mount
    useEffect(() => {
        const savedMessages = localStorage.getItem('driving-blind-messages');
        const savedGas = localStorage.getItem('driving-blind-gas');
        const savedDate = localStorage.getItem('driving-blind-date');
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

        if (savedDate === today) {
            if (savedMessages) setMessages(JSON.parse(savedMessages));
            if (savedGas) setGasTank(parseFloat(savedGas));
        } else {
            // New Day, Reset
            localStorage.setItem('driving-blind-date', today);
            localStorage.removeItem('driving-blind-messages');
            localStorage.removeItem('driving-blind-gas');

            // Explicitly set initial message for new game
            setMessages([
                { id: 'system-start', role: 'assistant', content: "THIS... is a mystery car! I'm sitting right here next to you. You're blindfolded. Ask me anything about the vehicle you're in but not the make, model, or year!" }
            ]);
            setGasTank(100);
        }
    }, []);

    // Save State to LocalStorage on change
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('driving-blind-messages', JSON.stringify(messages));
            localStorage.setItem('driving-blind-gas', gasTank.toString());
        }
    }, [messages, gasTank]);



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
                            backgroundColor: m.role === 'user' ? '#0070f3' : '#333',
                            borderBottomRightRadius: m.role === 'user' ? 0 : 12,
                            borderBottomLeftRadius: m.role === 'assistant' ? 0 : 12,
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
                        <p>You correctly guessed the car!</p>
                        <button onClick={() => window.location.reload()} style={styles.playAgainButton}>Play Again Tomorrow</button>
                    </div>
                ) : gameState === 'playing' && gasTank > 0 ? (
                    <form onSubmit={(e) => {
                        if ((input || '').length > 100) {
                            e.preventDefault();
                            alert("Keep it short! Under 100 chars.");
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
                            maxLength={100}
                            style={styles.textInput}
                            disabled={isLoading}
                        />
                        <button type="submit" style={styles.sendButton} disabled={isLoading || !input.trim()}>
                            SEND
                        </button>
                    </form>
                ) : (
                    <div style={styles.gameOver}>
                        {gasTank <= 0 ? "OUT OF GAS!" : "GAME OVER"}
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
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        padding: '15px',
        marginBottom: '15px',
        border: '1px solid #333',
    },
    messageRow: {
        display: 'flex',
        marginBottom: '10px',
    },
    bubble: {
        padding: '10px 14px',
        borderRadius: '12px',
        maxWidth: '80%',
        lineHeight: '1.4',
        fontSize: '0.95rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    avatar: {
        marginRight: '5px',
    },
    inputArea: {
        marginBottom: '30px',
    },
    chatForm: {
        display: 'flex',
        gap: '10px',
    },
    textInput: {
        flex: 1,
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #444',
        background: '#222',
        color: 'white',
        fontSize: '1rem',
    },
    sendButton: {
        padding: '0 20px',
        borderRadius: '8px',
        border: 'none',
        background: '#2196f3',
        color: 'white',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    loading: {
        textAlign: 'center',
        opacity: 0.5,
        fontSize: '0.8rem',
        marginTop: '10px',
    },
    guessSection: {
        marginTop: '20px',
        borderTop: '1px solid #333',
        paddingTop: '20px',
    },
    victory: {
        textAlign: 'center',
        padding: '20px',
        background: '#4caf50',
        borderRadius: '8px',
        fontWeight: 'bold',
    },
    playAgainButton: {
        marginTop: '10px',
        padding: '10px 20px',
        borderRadius: '8px',
        border: 'none',
        background: 'white',
        color: '#4caf50',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    gameOver: {
        textAlign: 'center',
        padding: '15px',
        background: '#e94560',
        borderRadius: '8px',
        fontWeight: 'bold',
    }
};
