import React, { useState, useEffect, useRef } from 'react';
import ImageDisplay from './ImageDisplay';
import GuessForm from './GuessForm';
import GuessHistory from './GuessHistory';
import GameOverModal from './GameOverModal';

import { useAuth } from '../contexts/AuthContext';
import { supabase, supabaseUrl } from '../lib/supabaseClient';

const GameContainer = () => {
    // Use US Eastern Time (America/New_York) to determine the daily car
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

    const [dailyCar, setDailyCar] = useState(null);
    const [loading, setLoading] = useState(true);

    const [guesses, setGuesses] = useState([]);
    const [gameState, setGameState] = useState('playing');
    const [showModal, setShowModal] = useState(false);
    const [userScore, setUserScore] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const { user } = useAuth();
    const prevUserIdRef = useRef(user ? user.id : 'anon');

    // ... existing logic ...

    // Fetch Daily Car
    useEffect(() => {
        setIsLoaded(false); // Reset load state when user/date changes to prevent race conditions during fetch
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
                        // We use dynamic crop URLs now, so we don't need these static proxy URLs in the state
                        // storing them for reference or fallback if needed, but primary logic will use ID
                        id: data.id,
                        transformOrigin: data.transform_origin,
                        maxZoom: data.max_zoom
                    };
                    setDailyCar(carData);

                    // Initialize state from local storage AFTER we have the car date/id
                    const userId = user ? user.id : 'anon';

                    // 1. Check if User already finished (Priority: Server User Score)
                    let completedScore = null;
                    if (user) {
                        const { data: scoreData } = await supabase
                            .from('user_scores')
                            .select('score')
                            .eq('user_id', user.id)
                            .eq('daily_game_id', carData.id)
                            .maybeSingle();

                        if (scoreData) {
                            completedScore = scoreData.score;
                        }
                    }

                    // 2. Try to load from Server Progress (Anti-Cheat)
                    let serverGuesses = null;
                    if (user) {
                        const { data: progressData } = await supabase
                            .from('game_progress')
                            .select('guesses')
                            .eq('user_id', user.id)
                            .eq('daily_game_id', carData.id)
                            .maybeSingle();

                        if (progressData) {
                            serverGuesses = progressData.guesses;
                            // Fix for potentially reversed guesses in DB (Winning guess should be last)
                            // If index 0 is a winner and there are multiple guesses, it's likely reversed [Newest, ..., Oldest]
                            if (serverGuesses && serverGuesses.length > 1) {
                                const first = serverGuesses[0];
                                const isFirstWinner = first.isMakeCorrect && first.isModelCorrect && first.isYearCorrect;
                                if (isFirstWinner) {
                                    serverGuesses = [...serverGuesses].reverse();
                                }
                            }
                        }
                    }

                    // 3. Try to load from LocalStorage
                    const storageKey = `cardle_state_${carData.date}_${userId}`;
                    const saved = localStorage.getItem(storageKey);

                    // --- STATE RESTORATION LOGIC ---

                    if (completedScore !== null) {
                        // CASE A: Game is Completed
                        setUserScore(completedScore);
                        setGameState('won'); // Default to 'won' for reveal, modal will show score
                        setShowModal(true);

                        // Restore guesses history if available (Server > Local > Empty)
                        if (serverGuesses && serverGuesses.length > 0) {
                            setGuesses(serverGuesses);
                        } else if (saved) {
                            const parsed = JSON.parse(saved);
                            setGuesses(parsed.guesses || []);
                        } else {
                            // If no history found, we still show the modal with the score
                            setGuesses([]);
                        }
                    }
                    else if (serverGuesses && serverGuesses.length > 0) {
                        // CASE B: In Progress (Server)
                        setGuesses(serverGuesses);

                        // Check if already lost (5 attempts used) but score maybe failed to save?
                        if (serverGuesses.length >= 5) {
                            const score = calculateScore(serverGuesses);
                            setUserScore(score);
                            setGameState('lost');
                            setShowModal(true);
                        } else {
                            setGameState('playing');
                            setShowModal(false);
                        }
                    }
                    else if (saved) {
                        // CASE C: In Progress (Local)
                        const parsed = JSON.parse(saved);
                        setGuesses(parsed.guesses || []);
                        setGameState(parsed.gameState || 'playing');

                        if (parsed.gameState === 'won' || parsed.gameState === 'lost') {
                            // Should have been caught by completedScore check if logged in,
                            // but handles Anon completion or sync issues.
                            const recoveredScore = calculateScore(parsed.guesses || []);
                            setUserScore(recoveredScore);
                            setShowModal(true);
                        } else {
                            setShowModal(false);
                        }
                    }
                    else {
                        // CASE D: New Game
                        setGuesses([]);
                        setGameState('playing');
                        setShowModal(false);
                        setUserScore(0);
                    }
                    setIsLoaded(true);
                }
            } catch (err) {
                console.error("Unexpected error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDailyCar();
    }, [today, user]);



    // Save state
    useEffect(() => {
        if (!dailyCar || !isLoaded) return; // Don't save if not loaded (prevents overwriting with empty initial state)

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
    }, [guesses, gameState, dailyCar, user, isLoaded]);

    if (loading) return <div style={styles.loading}>Loading Daily Car...</div>;
    if (!dailyCar) return <div style={styles.error}>No car scheduled for today ({today}). check back later!</div>;



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

    const saveProgress = async (newGuesses) => {
        if (!user || !dailyCar) return;

        try {
            await supabase
                .from('game_progress')
                .upsert({
                    user_id: user.id,
                    daily_game_id: dailyCar.id,
                    guesses: newGuesses
                }, { onConflict: 'user_id, daily_game_id' });
        } catch (err) {
            console.error("Error saving progress:", err);
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
        saveProgress(newGuesses); // Sync to DB immediately (Anti-Cheat)

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
            <ImageDisplay
                imageUrl={`${supabaseUrl}/functions/v1/serve-crop?id=${dailyCar.id}&stage=${gameState === 'playing' ? guesses.length : 5}`}
                zoomLevel={guesses.length}
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
                    dailyCar={{
                        ...dailyCar,
                        // Override static URLs with secure crop URLs for the modal
                        imageUrl: `${supabaseUrl}/functions/v1/serve-crop?id=${dailyCar.id}&stage=5`,
                        gameOverImageURL: dailyCar.game_over_image_url
                            ? dailyCar.game_over_image_url
                            : `${supabaseUrl}/functions/v1/serve-crop?id=${dailyCar.id}&stage=5`
                    }}
                    guesses={guesses}
                    gameState={gameState}
                    score={userScore}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
};

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
