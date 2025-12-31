import React, { useState, useEffect, useMemo } from 'react';
import initialDailyCars from '../data/dailyCars.json';
import carsData from '../data/cars.json';
import ImageDisplay from './ImageDisplay';

const ProofSheet = () => {
    const [puzzles, setPuzzles] = useState(() =>
        [...initialDailyCars].sort((a, b) => new Date(a.date) - new Date(b.date))
    );
    const [isLocal, setIsLocal] = useState(false);
    const [isEditing, setIsEditing] = useState(null); // ID of car being edited
    const [showAddForm, setShowAddForm] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Memoize the sorted puzzles to avoid re-sorting on every render
    const sortedPuzzles = useMemo(() => {
        return [...puzzles].sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [puzzles]);

    // Memoize the distribution summary
    const distributionSummary = useMemo(() => {
        const counts = puzzles.reduce((acc, car) => {
            const key = `${car.year}|${car.make}|${car.model}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1]) // Sort by count descending
            .map(([key, count]) => {
                const [year, make, model] = key.split('|');
                return { year, make, model, count };
            });
    }, [puzzles]);

    // Form states for adding/editing
    const [formData, setFormData] = useState({
        date: '',
        make: '',
        model: '',
        year: '',
        imageUrl: '',
        gameOverImageURL: '',
        transformOrigin: 'center center',
        maxZoom: 5
    });

    useEffect(() => {
        fetchPuzzles();
    }, []);

    const fetchPuzzles = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/puzzles');
            if (res.ok) {
                const data = await res.json();
                setPuzzles(data);
                setIsLocal(true);
            }
        } catch (e) {
            console.log("Not running locally or dev-server not started. CRUD disabled.");
            setIsLocal(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const url = isEditing
            ? `http://localhost:3001/api/puzzles/${isEditing}`
            : 'http://localhost:3001/api/puzzles';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    make: formData.make.toUpperCase()
                })
            });
            if (res.ok) {
                fetchPuzzles();
                setIsEditing(null);
                setShowAddForm(false);
                resetForm();
            }
        } catch (e) {
            alert("Failed to save. Is dev-server.js running?");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this puzzle?")) return;
        try {
            const res = await fetch(`http://localhost:3001/api/puzzles/${id}`, { method: 'DELETE' });
            if (res.ok) fetchPuzzles();
        } catch (e) {
            alert("Failed to delete.");
        }
    };

    const startEdit = (car) => {
        setIsEditing(car.id);
        setFormData({
            ...car,
            make: car.make.toUpperCase(),
            maxZoom: parseFloat(car.maxZoom) || 5
        });
        window.scrollTo({ top: 0 }); // Removed smooth scroll as it can be heavy during complex renders
    };

    const resetForm = () => {
        setFormData({
            date: '',
            make: '',
            model: '',
            year: '',
            imageUrl: '',
            gameOverImageURL: '',
            transformOrigin: 'center center',
            maxZoom: 5
        });
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1>Proof Sheet {isLocal && <span style={styles.badge}>DASHBOARD MODE</span>}</h1>
                <p>Reviewing {puzzles.length} configured cars</p>
                {isLoading && <p>Loading data...</p>}
                {!isLocal && !isLoading && <p style={{ color: '#888', fontSize: '0.8rem' }}>Run `npm run dev` to enable editing</p>}
            </header>

            {isLocal && (
                <div style={styles.adminControls}>
                    <button
                        onClick={() => { setShowAddForm(!showAddForm); setIsEditing(null); resetForm(); }}
                        style={styles.addButton}
                    >
                        {showAddForm || isEditing ? 'Cancel' : '+ Add New Daily Car'}
                    </button>
                </div>
            )}

            {(showAddForm || isEditing) && (
                <section style={styles.formSection}>
                    <h2>{isEditing ? 'Edit Car' : 'Add New Daily Car'}</h2>
                    <form onSubmit={handleSave} style={styles.crudForm}>
                        <div style={styles.formRow}>
                            <div style={styles.field}>
                                <label style={styles.label}>Date:</label>
                                <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required style={styles.crudInput} />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Year:</label>
                                <input type="number" value={formData.year} onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })} required style={styles.crudInput} />
                            </div>
                        </div>

                        <div style={styles.formRow}>
                            <div style={styles.field}>
                                <label style={styles.label}>Make:</label>
                                <select value={formData.make} onChange={e => setFormData({ ...formData, make: e.target.value, model: '' })} required style={styles.crudInput}>
                                    <option value="">Select Make</option>
                                    {carsData.makes.map(m => <option key={m.id} value={m.make}>{m.make}</option>)}
                                </select>
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Model:</label>
                                <select value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} required style={styles.crudInput}>
                                    <option value="">Select Model</option>
                                    {formData.make && carsData.makes.find(m => m.make === formData.make)?.models.map(m => (
                                        <option key={m.id} value={m.model}>{m.model}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>Source Image URL:</label>
                            <input type="url" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} required style={styles.crudInput} />
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>Reveal Image URL (Optional):</label>
                            <input type="url" value={formData.gameOverImageURL} onChange={e => setFormData({ ...formData, gameOverImageURL: e.target.value })} style={styles.crudInput} />
                        </div>

                        <div style={styles.formRow}>
                            <div style={styles.field}>
                                <label style={styles.label}>Max Zoom (Guess #1): {formData.maxZoom}</label>
                                <input type="range" min="1" max="10" step="0.1" value={formData.maxZoom} onChange={e => setFormData({ ...formData, maxZoom: parseFloat(e.target.value) })} style={styles.rangeInput} />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Transform Origin (X% Y%):</label>
                                <input type="text" value={formData.transformOrigin} placeholder="35% 50%" onChange={e => setFormData({ ...formData, transformOrigin: e.target.value })} style={styles.crudInput} />
                            </div>
                        </div>

                        <div style={styles.previewContainer}>
                            <h3 style={styles.previewTitle}>Live Crop Preview (Guess #1 Zoom)</h3>
                            <div style={styles.previewWrapper}>
                                <ImageDisplay
                                    imageUrl={formData.imageUrl}
                                    zoomLevel={1}
                                    gameStatus='playing'
                                    transformOrigin={formData.transformOrigin}
                                    maxZoom={formData.maxZoom}
                                />
                            </div>
                        </div>

                        <button type="submit" style={styles.saveButton}>
                            {isEditing ? 'Save Changes' : 'Create Puzzle'}
                        </button>
                    </form>
                </section>
            )}

            <section style={styles.summarySection}>
                <h2 style={styles.subTitle}>Car Distribution Summary</h2>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Year</th>
                            <th style={styles.th}>Make</th>
                            <th style={styles.th}>Model</th>
                            <th style={styles.th}>Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {distributionSummary.map((item, idx) => {
                            const key = `${item.year}|${item.make}|${item.model}`;
                            return (
                                <tr key={key} style={styles.tr}>
                                    <td style={styles.td}>{item.year}</td>
                                    <td style={styles.td}>{item.make}</td>
                                    <td style={styles.td}>{item.model}</td>
                                    <td style={{ ...styles.td, fontWeight: 'bold', color: item.count > 3 ? '#e94560' : '#ccc' }}>
                                        {item.count}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </section>

            <div style={styles.grid}>
                {sortedPuzzles.map((car) => (
                    <div key={car.id || car.date} style={styles.card}>
                        <div style={styles.imageContainer}>
                            <ImageDisplay
                                imageUrl={car.imageUrl}
                                zoomLevel={1}
                                gameStatus='playing'
                                transformOrigin={car.transformOrigin}
                                maxZoom={car.maxZoom}
                            />
                        </div>
                        <div style={styles.metadata}>
                            <strong>ID:</strong> {car.id}<br />
                            <strong>Date:</strong> {car.date}<br />
                            <strong>Car:</strong> {car.year} {car.make} {car.model}<br />
                            <a href={car.imageUrl} target="_blank" rel="noopener noreferrer" style={styles.link}>
                                Source Image
                            </a>
                            {car.gameOverImageURL && (
                                <>
                                    {' | '}
                                    <a href={car.gameOverImageURL} target="_blank" rel="noopener noreferrer" style={styles.link}>
                                        Reveal Image
                                    </a>
                                </>
                            )}
                            {isLocal && (
                                <div style={styles.cardActions}>
                                    <button onClick={() => startEdit(car)} style={styles.editButton}>Adjust</button>
                                    <button onClick={() => handleDelete(car.id)} style={styles.deleteButton}>Remove</button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
        color: '#fff',
    },
    header: {
        textAlign: 'center',
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    badge: {
        fontSize: '0.8rem',
        backgroundColor: '#e94560',
        padding: '2px 8px',
        borderRadius: '12px',
        verticalAlign: 'middle',
        marginLeft: '10px'
    },
    adminControls: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '30px'
    },
    addButton: {
        padding: '10px 20px',
        backgroundColor: '#a3f7bf',
        color: '#1a1a2e',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    formSection: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: '30px',
        borderRadius: '12px',
        marginBottom: '40px',
        border: '1px solid rgba(163, 247, 191, 0.3)',
    },
    crudForm: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        maxWidth: '800px',
        margin: '0 auto'
    },
    formRow: {
        display: 'flex',
        gap: '20px',
    },
    field: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    label: {
        fontSize: '0.9rem',
        color: '#888',
        fontWeight: 'bold'
    },
    crudInput: {
        padding: '10px',
        backgroundColor: '#16213e',
        border: '1px solid #0f3460',
        borderRadius: '4px',
        color: '#fff',
        fontSize: '1rem'
    },
    rangeInput: {
        width: '100%',
        margin: '10px 0'
    },
    previewContainer: {
        border: '1px dashed #444',
        padding: '20px',
        borderRadius: '8px',
        textAlign: 'center'
    },
    previewTitle: {
        fontSize: '1rem',
        marginBottom: '15px',
        color: '#a3f7bf'
    },
    previewWrapper: {
        display: 'inline-block',
        border: '1px solid #555'
    },
    saveButton: {
        padding: '15px',
        backgroundColor: '#e94560',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '1.1rem',
        cursor: 'pointer',
        marginTop: '10px'
    },
    summarySection: {
        marginBottom: '40px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        maxWidth: '800px',
        margin: '0 auto 40px auto'
    },
    subTitle: {
        fontSize: '1.2rem',
        marginBottom: '15px',
        textAlign: 'center',
        color: '#fff'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        color: '#ccc',
        fontSize: '0.9rem'
    },
    th: {
        textAlign: 'left',
        padding: '8px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        color: '#888',
        fontWeight: 'bold'
    },
    tr: {
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    },
    td: {
        padding: '8px',
    },
    grid: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        justifyContent: 'center'
    },
    card: {
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '15px',
        width: '280px',
        display: 'flex',
        flexDirection: 'column',
    },
    imageContainer: {
        marginBottom: '10px',
        borderRadius: '8px',
        overflow: 'hidden'
    },
    metadata: {
        width: '100%',
        fontSize: '0.85rem',
        color: '#ccc',
        lineHeight: '1.4'
    },
    link: {
        color: '#a3f7bf',
        textDecoration: 'none',
        fontSize: '0.8rem',
    },
    cardActions: {
        marginTop: '15px',
        display: 'flex',
        gap: '10px',
        borderTop: '1px solid #333',
        paddingTop: '10px'
    },
    editButton: {
        flex: 1,
        padding: '5px',
        backgroundColor: '#0f3460',
        color: '#a3f7bf',
        border: '1px solid #a3f7bf',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.8rem'
    },
    deleteButton: {
        flex: 1,
        padding: '5px',
        backgroundColor: 'transparent',
        color: '#a3f7bf', // Changed from red to green text
        border: '1px solid #e94560', // Keeps red border for warning
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.8rem'
    }
};

export default ProofSheet;
