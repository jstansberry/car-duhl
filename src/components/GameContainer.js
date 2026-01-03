import React, { useState, useEffect, useRef } from 'react';
import ImageDisplay from './ImageDisplay';
import GuessForm from './GuessForm';
import GuessHistory from './GuessHistory';
import GameOverModal from './GameOverModal';
import Login from './Login';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const GameContainer = () => {
    // Use US Eastern Time (America/New_York) to determine the daily car
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

    const [dailyCar, setDailyCar] = useState(null);
    const [loading, setLoading] = useState(true);

    const [guesses, setGuesses] = useState([]);
    const [gameState, setGameState] = useState('playing');
    const [showModal, setShowModal] = useState(false);
    const [userScore, setUserScore] = useState(0);
    const { user } = useAuth();
    const prevUserIdRef = useRef(user ? user.id : 'anon');

    // ... existing logic ...

    // Fetch Daily Car
    useEffect(() => {
        const fetchDailyCar = async () => {
            try {
                // Adjust date format if stored differently in DB, but assuming standard YYYY-MM-DD
                const { data, error } = await supabase
                    .from('daily_games')
                    .select(`
                        *,
                        make:makes(name),
                        model:models(name)
                    `)
                    .eq('date', today)
                    .single();

                if (error) {
                    console.error("Error fetching daily car:", error);
                    // Fallback or error state?
                    return;
                }

                if (data) {
                    // Normalize data to match component expectation
                    const carData = {
                        ...data,
                        make: data.make.name,
                        model: data.model.name,
                        imageUrl: data.image_url,
                        gameOverImageURL: data.game_over_image_url,
                        transformOrigin: data.transform_origin,
                        maxZoom: data.max_zoom
                    };
                    setDailyCar(carData);

                    // Initialize state from local storage AFTER we have the car date/id
                    const userId = user ? user.id : 'anon';
                    const storageKey = `cardle_state_${carData.date}_${userId}`;
                    const saved = localStorage.getItem(storageKey);
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        setGuesses(parsed.guesses || []);
                        setGameState(parsed.gameState || 'playing');
                        if (parsed.gameState === 'won' || parsed.gameState === 'lost') {
                            setShowModal(true);
                        }
                    } else {
                        // Reset if no saved state for this user (e.g. switching from anon to user)
                        setGuesses([]);
                        setGameState('playing');
                        setShowModal(false);
                    }
                }
            } catch (err) {
                console.error("Unexpected error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDailyCar();
    }, [today, user]);

    // Check for existing score (Replay Prevention)
    useEffect(() => {
        const checkUserScore = async () => {
            if (!user || !dailyCar) return;

            try {
                const { data, error } = await supabase
                    .from('user_scores')
                    .select('score')
                    .eq('user_id', user.id)
                    .eq('daily_game_id', dailyCar.id)
                    .single();

                if (data) {
                    // User already played
                    setUserScore(data.score);
                    setGameState('won'); // Reveal image
                    setShowModal(true); // Show results immediately
                    setGuesses([]); // Clear guesses as per requirement
                }
            } catch (err) {
                console.error("Error checking score:", err);
            }
        };

        checkUserScore();
    }, [user, dailyCar]);

    // Save state
    useEffect(() => {
        if (!dailyCar) return;

        const currentUserId = user ? user.id : 'anon';

        // If user changed, don't save (prevent overwriting new user's state with old user's data)
        if (prevUserIdRef.current !== currentUserId) {
            prevUserIdRef.current = currentUserId;
            return;
        }

        const storageKey = `cardle_state_${dailyCar.date}_${currentUserId}`;
        localStorage.setItem(storageKey, JSON.stringify({
            guesses,
            gameState
        }));
    }, [guesses, gameState, dailyCar, user]);

    if (loading) return <div style={styles.loading}>Loading Daily Car...</div>;
    if (!dailyCar) return <div style={styles.error}>No car scheduled for today ({today}). check back later!</div>;

    const calculateScore = (finalGuesses) => {
        // Perfect First Try (All 3 correct on first guess)
        if (finalGuesses.length > 0) {
            const first = finalGuesses[0];
            if (first.isMakeCorrect && first.isModelCorrect && first.isYearCorrect) {
                return 100;
            }
        }

        let score = 0;
        const found = { make: false, model: false, year: false };
        const pointsMap = [25, 20, 15, 10, 5];

        finalGuesses.forEach((g, index) => {
            if (index > 4) return; // Max 5 attempts for points
            const pts = pointsMap[index];

            if (!found.make && g.isMakeCorrect) {
                score += pts;
                found.make = true;
            }
            if (!found.model && g.isModelCorrect) {
                score += pts;
                found.model = true;
            }
            if (!found.year && g.isYearCorrect) {
                score += pts;
                found.year = true;
            }
        });

        return score;
    };

    const saveScore = async (score) => {
        if (!user || !dailyCar) return;

        try {
            await supabase
                .from('user_scores')
                .insert({
                    user_id: user.id,
                    daily_game_id: dailyCar.id,
                    score: score
                });
        } catch (err) {
            console.error("Error saving score:", err);
        }
    };

    const handleGuess = (guess) => {
        if (gameState !== 'playing') return;

        // Prevent duplicate guesses
        const isDuplicate = guesses.some(g =>
            g.make === guess.make &&
            g.model === guess.model &&
            g.year === guess.year
        );

        if (isDuplicate) {
            alert("You have already made this guess!");
            return;
        }

        const isMakeCorrect = guess.make.toLowerCase() === dailyCar.make.toLowerCase();
        const isModelCorrect = guess.model.toLowerCase() === dailyCar.model.toLowerCase();
        // Year tolerance +/- 2
        const isYearCorrect = Math.abs(guess.year - dailyCar.year) <= 2;

        const newGuess = {
            ...guess,
            isMakeCorrect,
            isModelCorrect,
            isYearCorrect
        };

        const newGuesses = [...guesses, newGuess];
        setGuesses(newGuesses);

        // Check Win
        if (isMakeCorrect && isModelCorrect && isYearCorrect) {
            setGameState('won');
            const finalScore = calculateScore(newGuesses);
            setUserScore(finalScore);
            saveScore(finalScore);
            setTimeout(() => setShowModal(true), 2500);
        }
        // Check Loss
        else if (newGuesses.length >= 5) {
            setGameState('lost');
            const finalScore = calculateScore(newGuesses);
            setUserScore(finalScore);
            saveScore(finalScore);
            setTimeout(() => setShowModal(true), 2500);
        }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <h1 style={styles.title}>CAR-DUHL</h1>
                    <p style={styles.subtitle}>Guess the car in 5 or fewer attempts!</p>
                </div>
                <Login />
            </header>

            <ImageDisplay
                imageUrl={dailyCar.imageUrl}
                zoomLevel={guesses.length + .1} // Zoom out rate
                gameStatus={gameState}
                transformOrigin={dailyCar.transformOrigin}
                maxZoom={dailyCar.maxZoom}
            />

            <GuessForm
                onGuess={handleGuess}
                gameState={gameState}
                onViewResults={() => setShowModal(true)}
            />

            <GuessHistory guesses={guesses} />

            {showModal && (
                <GameOverModal
                    dailyCar={dailyCar}
                    guesses={guesses}
                    gameState={gameState}
                    score={userScore}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: '500px',
        margin: '0 auto',
        padding: '20px',
        textAlign: 'center',
        color: '#fff',
        fontFamily: 'Arial, sans-serif'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        width: '100%',
        textAlign: 'left'
    },
    headerLeft: {
        display: 'flex',
        flexDirection: 'column',
    },
    title: {
        margin: 0,
        fontSize: '2rem',
        color: '#e94560',
        fontWeight: 'bold',
        letterSpacing: '1px'
    },
    subtitle: {
        margin: '5px 0 0 0',
        fontSize: '0.9rem',
        color: '#ccc'
    },
    loading: {
        color: 'white',
        fontSize: '1.5rem',
        marginTop: '50px',
    },
    error: {
        color: '#ff6b6b',
        fontSize: '1.5rem',
        marginTop: '50px',
    },
};

export default GameContainer;
