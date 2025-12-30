import React, { useState, useEffect } from 'react';
import ImageDisplay from './ImageDisplay';
import GuessForm from './GuessForm';
import GuessHistory from './GuessHistory';
import GameOverModal from './GameOverModal';
import dailyCars from '../data/dailyCars.json';

const GameContainer = () => {
    // Current date logic could be improved for timezones, using local string for now
    const today = new Date().toISOString().split('T')[0];

    // Fallback to first car if today isn't found (for demo purposes)
    const dailyCar = dailyCars.find(c => c.date === today) || dailyCars[0];
    const storageKey = `cardle_state_${dailyCar.date}`;

    const [guesses, setGuesses] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved).guesses : [];
    });

    const [gameState, setGameState] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved).gameState : 'playing';
    });

    const [showModal, setShowModal] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            const { gameState } = JSON.parse(saved);
            return gameState === 'won' || gameState === 'lost';
        }
        return false;
    });

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify({
            guesses,
            gameState
        }));
    }, [guesses, gameState, storageKey]);

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
            setTimeout(() => setShowModal(true), 1500); // Slight delay for dramatic effect
        }
        // Check Loss
        else if (newGuesses.length >= 5) {
            setGameState('lost');
            setTimeout(() => setShowModal(true), 1500);
        }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1>CAR-DUHL</h1>
                <p>Guess the car in 5 attempts or less!</p>
            </header>

            <ImageDisplay
                imageUrl={dailyCar.imageUrl}
                zoomLevel={guesses.length + 1} // Starts at 1, goes up
                gameStatus={gameState}
                transformOrigin={dailyCar.transformOrigin}
                maxZoom={dailyCar.maxZoom}
            />

            <GuessForm onGuess={handleGuess} disabled={gameState !== 'playing'} />

            <GuessHistory guesses={guesses} />

            {showModal && (
                <GameOverModal
                    dailyCar={dailyCar}
                    guesses={guesses}
                    gameState={gameState}
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
        padding: '20px',
        maxWidth: '600px',
        margin: '0 auto',
    },
    header: {
        textAlign: 'center',
        marginBottom: '20px',
    },
};

export default GameContainer;
