import React, { useState, useEffect } from 'react';
import carsData from '../data/cars.json';

const GuessForm = ({ onGuess, disabled }) => {
    const [selectedMake, setSelectedMake] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [year, setYear] = useState('');

    const [availableModels, setAvailableModels] = useState([]);

    // Populate models when make changes
    useEffect(() => {
        if (selectedMake) {
            const makeData = carsData.makes.find(m => m.make === selectedMake);
            if (makeData) {
                setAvailableModels(makeData.models);
            } else {
                setAvailableModels([]);
            }
        } else {
            setAvailableModels([]);
        }
        setSelectedModel(''); // Reset model when make changes
    }, [selectedMake]);

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
            <div style={styles.row}>
                <select
                    value={selectedMake}
                    onChange={(e) => setSelectedMake(e.target.value)}
                    disabled={disabled}
                    style={styles.input}
                    required
                >
                    <option value="">Select Make</option>
                    {carsData.makes.map(make => (
                        <option key={make.id} value={make.make}>{make.make}</option>
                    ))}
                </select>

                <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={!selectedMake || disabled}
                    style={styles.input}
                    required
                >
                    <option value="">Select Model</option>
                    {availableModels.map(model => (
                        <option key={model.id} value={model.model}>{model.model}</option>
                    ))}
                </select>

                <input
                    type="number"
                    placeholder="Year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    disabled={disabled}
                    style={{
                        ...styles.input,
                        width: '80px',
                        MozAppearance: 'textfield', // Firefox
                    }}
                    className="no-spinner"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    required
                />
            </div>
            <button type="submit" disabled={disabled} style={styles.button}>
                GUESS
            </button>
        </form>
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
    }
};

export default GuessForm;
