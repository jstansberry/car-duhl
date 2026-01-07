import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const GuessForm = ({ onGuess, gameState, onViewResults, solved = {}, correctValues = {} }) => {
    const [selectedMake, setSelectedMake] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [year, setYear] = useState('');

    const [makes, setMakes] = useState([]);
    const [availableModels, setAvailableModels] = useState([]);

    // Fetch Makes on initial load
    useEffect(() => {
        const fetchMakes = async () => {
            const { data, error } = await supabase
                .from('makes')
                .select('*')
                .order('name', { ascending: true });

            if (!error && data) {
                setMakes(data);
            }
        };
        fetchMakes();
    }, []);

    // Auto-fill and lock solved fields
    useEffect(() => {
        if (solved.make && correctValues.make) {
            setSelectedMake(correctValues.make);
            // Also need to ensure model list is populated if we force make? 
            // The existing make-change effect handles model fetching, 
            // but we might need to verify timing or dependencies.
        }
        // If make is solved, model might also be solved
        if (solved.model && correctValues.model) {
            setSelectedModel(correctValues.model);
        }
        if (solved.year && correctValues.year) {
            setYear(correctValues.year);
        }
    }, [solved, correctValues]);

    // Fetch models when make changes
    useEffect(() => {
        const fetchModels = async () => {
            // If make is solved/forced, we still need to load models so the "Select Model" works 
            // (unless model is also solved, in which case it's just locked).
            // The logic below works fine even if forced.
            if (selectedMake) {
                // We need to look up the make ID first, or we can assume we stored the make object in state
                // Actually, the select value is currently the Make Name (string) based on old code
                // Let's keep it as Make Name for the onGuess prop compatibility, but we need ID for model lookup
                const makeObj = makes.find(m => m.name === selectedMake);

                if (makeObj) {
                    const { data, error } = await supabase
                        .from('models')
                        .select('*')
                        .eq('make_id', makeObj.id)
                        .order('name', { ascending: true });

                    if (!error && data) {
                        setAvailableModels(data);
                    } else {
                        setAvailableModels([]);
                    }
                }
            } else {
                setAvailableModels([]);
            }
            setSelectedModel(''); // Reset model when make changes
        };

        fetchModels();
    }, [selectedMake, makes]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedMake && selectedModel && year) {
            onGuess({
                make: selectedMake,
                model: selectedModel,
                year: parseInt(year, 10)
            });
            // Optionally reset form here
        }
    };

    return (
        <form onSubmit={handleSubmit} style={styles.form}>
            <div className="guess-form-row">
                <select
                    value={selectedMake}
                    onChange={(e) => setSelectedMake(e.target.value)}
                    disabled={gameState !== 'playing' || solved.make}
                    className="guess-input guess-input-make"
                    style={solved.make ? styles.solvedInput : {}}
                    required
                >
                    <option value="">Select Make</option>
                    {makes.map(make => (
                        <option key={make.id} value={make.name}>{make.name}</option>
                    ))}
                </select>

                <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={!selectedMake || gameState !== 'playing' || solved.model}
                    className="guess-input guess-input-model"
                    style={solved.model ? styles.solvedInput : {}}
                    required
                >
                    <option value="">Select Model</option>
                    {availableModels.map(model => (
                        <option key={model.id} value={model.name}>{model.name}</option>
                    ))}
                </select>

                <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    disabled={gameState !== 'playing' || solved.year}
                    className="guess-input guess-input-year"
                    style={solved.year ? styles.solvedInput : {}}
                    required
                >
                    <option value="">Year</option>
                    {Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => new Date().getFullYear() - i).map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>
            <button
                type={gameState === 'playing' ? "submit" : "button"}
                onClick={gameState !== 'playing' ? onViewResults : undefined}
                style={{
                    ...styles.button,
                    backgroundColor: gameState === 'playing' ? '#333' : '#e94560'
                }}
            >
                {gameState === 'playing' ? 'GUESS' : 'VIEW RESULTS'}
            </button>

            <div style={styles.hint}>year +/- 2</div>
        </form >
    );
};

const styles = {
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '500px',
        width: '100%',
        margin: '0 auto',
        alignItems: 'center', // Center the button
    },
    row: {
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
        width: '100%',
    },
    input: {
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        fontSize: '16px',
        flex: 1,
    },
    button: {
        padding: '10px',
        backgroundColor: '#333',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        width: '50%', // Reduced width
    },
    hint: {
        color: '#fff',
        fontSize: '0.9rem',
        marginTop: '5px'
    },
    solvedInput: {
        border: '2px solid #4caf50',
        backgroundColor: '#e8f5e9',
        color: '#2e7d32',
        fontWeight: 'bold'
    }
};

export default GuessForm;
