'use client';

import React, { useState, useEffect } from 'react';
// import { useChat } from '@ai-sdk/react'; // Removing to use custom fetch
import { supabase, supabaseUrl, supabaseAnonKey } from '../../lib/supabaseClient';
import GuessForm from '../../components/GuessForm';

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

            // Expecting plain text response from Edge Function
            const text = await response.text();

            // Append AI response
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: text
            }]);

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

    const onGuess = async ({ make, model, year }) => {
        // Here we would verify against the daily car. 
        // BUT, the client doesn't know the daily car! 
        // We typically need to verify on the server OR fetch the answer hash.
        // For this prototype, we'll verify via a server action or API call?
        // Or simpler: The API route *could* return the answer in a hidden header or we verify via a new API endpoint.
        // Let's create a quick verification endpoint or just mock it for now.
        // Wait, 'getDailyCar' is in the API route. I need to expose a way to check the answer.
        // I'll add a 'check-answer' query param to the chat route or a separate route.
        // Let's assume we make a separate call.

        // For now, I'll just Alert "Submitted" because I haven't built the verification API yet.
        // Actually, I should probably build a '/api/check-answer' route.
        // Check Task List: "Verify Statefulness" - but I need to verifying guesses.
        // I will add a TODO for verification and implement a basic client-side check if I can get the car data.

        // BETTER: When the component mounts, fetch the *hashed* answer or similar? 
        // No, keep it secret.

        try {
            const response = await fetch('/api/driving-blind/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ make, model, year })
            });
            const result = await response.json();

            if (result.correct) {
                setGameState('won');
                setMessages(prev => [...prev, { id: 'win', role: 'assistant', content: `VICTORY! You guessed it! It WAS the ${year} ${make} ${model}!` }]);
            } else {
                setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: `WRONG! It is NOT a ${year} ${make} ${model}. Keep guessing!` }]);
                // Maybe penalty on gas?
                setGasTank(prev => Math.max(0, prev - 10));
            }
        } catch (e) {
            console.error(e);
        }
    };

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
                            {m.role === 'assistant' && <span style={styles.avatar}>🚙 </span>}
                            {m.content}
                        </div>
                    </div>
                ))}
                {isLoading && <div style={styles.loading}>I'm thinking...</div>}
            </div>

            {/* Input Area */}
            <div style={styles.inputArea}>
                {gameState === 'playing' && gasTank > 0 ? (
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

            {/* Guess Form Area */}
            <div style={styles.guessSection}>
                <h3>Ready to Guess?</h3>
                <GuessForm
                    onGuess={onGuess}
                    gameState={gameState === 'won' ? 'won' : 'playing'}
                    currentGuessCount={0} // We can track guesses if we want
                />
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
    gameOver: {
        textAlign: 'center',
        padding: '15px',
        background: '#e94560',
        borderRadius: '8px',
        fontWeight: 'bold',
    }
};
