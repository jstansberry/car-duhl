'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, supabaseUrl } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import ImageDisplay from './ImageDisplay';


const ProofSheet = () => {
    const { isAdmin, loading: authLoading, profileLoaded, session } = useAuth();
    const router = useRouter();

    // Redirect non-admins
    // Redirect non-admins
    useEffect(() => {
        if (!authLoading && profileLoaded && !isAdmin) {
            router.push('/');
        }
    }, [isAdmin, authLoading, profileLoaded, router]);

    // Inject spinner animation styles on mount
    useEffect(() => {
        const styleSheet = document.createElement("style");
        styleSheet.innerText = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        `;
        document.head.appendChild(styleSheet);
        return () => {
            document.head.removeChild(styleSheet);
        };
    }, []);



    // All puzzles
    const [puzzles, setPuzzles] = useState([]);
    const [makes, setMakes] = useState([]);
    const [models, setModels] = useState([]);
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

    // Date Filters
    // Helper to get YYYY-MM-DD in NY timezone
    const getNYDateString = (offsetDays = 0) => {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        return d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    };

    const [filterStartDate, setFilterStartDate] = useState(getNYDateString(0));
    const [filterEndDate, setFilterEndDate] = useState(getNYDateString(30));

    // Auth / Editing State
    const [isEditing, setIsEditing] = useState(null); // ID of car being edited
    const [showAddForm, setShowAddForm] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingHints, setIsGeneratingHints] = useState(false);

    // Form states for adding/editing
    const [formData, setFormData] = useState({
        date: '',
        make_id: '',
        model_id: '',
        year: '',
        imageUrl: '',
        gameOverImageURL: '',
        source: '',
        transformOrigin: 'center center',
        maxZoom: 5,
        country: '',
        funFacts: ''
    });

    // Memoize the sorted and filtered puzzles
    const filteredPuzzles = useMemo(() => {
        return puzzles
            .filter(p => {
                if (!filterStartDate && !filterEndDate) return true;
                const pDate = p.date; // String comparison works for YYYY-MM-DD
                const start = filterStartDate || '0000-01-01';
                const end = filterEndDate || '9999-12-31';
                return pDate >= start && pDate <= end;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [puzzles, filterStartDate, filterEndDate]);

    // Memoize the distribution summary
    const distributionSummary = useMemo(() => {
        const counts = filteredPuzzles.reduce((acc, car) => {
            const key = `${car.make}|${car.model}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1]) // Sort by count descending
            .map(([key, count]) => {
                const [make, model] = key.split('|');
                return { make, model, count };
            });
    }, [filteredPuzzles]);

    useEffect(() => {
        if (isAdmin) {
            fetchPuzzles();
            fetchMakes();
        }
    }, [isAdmin]);

    // When Make changes, fetch relevant models
    useEffect(() => {
        if (formData.make_id) {
            fetchModels(formData.make_id);
        } else {
            setModels([]);
        }
    }, [formData.make_id]);

    const fetchPuzzles = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('daily_games')
                .select(`
                    *,
                    make:makes(id, name),
                    model:models(id, name)
                `)
                .order('date', { ascending: true });

            if (error) throw error;

            // Flatten data for easier consumption
            const formatted = data.map(d => ({
                id: d.id,
                date: d.date,
                year: d.year,
                make: d.make?.name || 'Unknown',
                model: d.model?.name || 'Unknown',
                make_id: d.make_id,
                model_id: d.model_id,
                imageUrl: d.image_url,
                gameOverImageURL: d.game_over_image_url || '',
                source: d.source || '',
                transformOrigin: d.transform_origin,
                maxZoom: d.max_zoom,
                country: d.country || '',
                funFacts: d.fun_facts || ''
            }));

            setPuzzles(formatted);
        } catch (error) {
            console.error('Error fetching puzzles:', error);
            alert('Error loading puzzles');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMakes = async () => {
        try {
            const { data, error } = await supabase
                .from('makes')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setMakes(data || []);
        } catch (error) {
            console.error('Error fetching makes:', error);
        }
    };

    const fetchModels = async (makeId) => {
        try {
            const { data, error } = await supabase
                .from('models')
                .select('*')
                .eq('make_id', makeId)
                .order('name', { ascending: true });

            if (error) throw error;
            setModels(data || []);
        } catch (error) {
            console.error('Error fetching models:', error);
        }
    };

    const generateHints = async () => {
        if (!formData.make_id || !formData.model_id) {
            alert("Please select a Make and Model first.");
            return;
        }

        const makeName = makes.find(m => m.id == formData.make_id)?.name;
        const modelName = models.find(m => m.id == formData.model_id)?.name;

        setIsGeneratingHints(true);
        try {
            const { data, error } = await supabase.functions.invoke('generate-hints', {
                body: {
                    make: makeName,
                    model: modelName,
                    year: formData.year
                }
            });

            if (error) throw error;
            if (data) {
                setFormData(prev => ({
                    ...prev,
                    country: data.country_code || prev.country,
                    funFacts: data.fun_facts || prev.funFacts
                }));
            }
        } catch (error) {
            console.error("Error generating hints:", error);
            // Log full error details for debugging
            if (error && typeof error === 'object') {
                console.error("Error Details:", JSON.stringify(error, null, 2));
            }
            alert(`Failed to generate hints: ${error.message} \nSee console for details.`);
        } finally {
            setIsGeneratingHints(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const payload = {
                date: formData.date,
                year: parseInt(formData.year),
                make_id: parseInt(formData.make_id),
                model_id: parseInt(formData.model_id),
                image_url: formData.imageUrl,
                game_over_image_url: formData.gameOverImageURL || null,
                source: formData.source || null,
                transform_origin: formData.transformOrigin,
                max_zoom: parseFloat(formData.maxZoom),
                country: formData.country || null,
                fun_facts: formData.funFacts || null
            };

            let savedId = isEditing;
            let error;

            if (isEditing) {
                const { error: updateError } = await supabase
                    .from('daily_games')
                    .update(payload)
                    .eq('id', isEditing);
                error = updateError;
            } else {
                const { data: inserted, error: insertError } = await supabase
                    .from('daily_games')
                    .insert([payload])
                    .select()
                    .single();
                error = insertError;
                if (inserted) savedId = inserted.id;
            }

            if (error) throw error;

            // Determine if we need to regenerate crops
            let shouldGenerateCrops = true;
            if (isEditing) {
                const original = puzzles.find(p => p.id === isEditing);
                if (original) {
                    const imageSame = original.imageUrl === formData.imageUrl;
                    const zoomSame = parseFloat(original.maxZoom) === parseFloat(formData.maxZoom);
                    const originSame = original.transformOrigin === formData.transformOrigin;

                    if (imageSame && zoomSame && originSame) {
                        shouldGenerateCrops = false;
                    }
                }
            }

            if (shouldGenerateCrops) {
                // Trigger Server-Side Crop Generation
                const { error: genError } = await supabase.functions.invoke('generate-crops', {
                    body: { id: savedId }
                });

                if (genError) {
                    console.error("Crop generation failed:", genError);
                    alert("Puzzle saved, but crop generation failed. Please try saving again.");
                } else {
                    fetchPuzzles();
                    setIsEditing(null);
                    setShowAddForm(false);
                    resetForm();
                }
            } else {
                console.log("Skipping crop generation - no image changes detected.");
                fetchPuzzles();
                setIsEditing(null);
                setShowAddForm(false);
                resetForm();
            }

        } catch (error) {
            console.error('Error saving puzzle:', error);
            alert(`Failed to save: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this puzzle?")) return;
        try {
            const { error } = await supabase
                .from('daily_games')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchPuzzles();
        } catch (error) {
            console.error('Error deleting puzzle:', error);
            alert('Failed to delete puzzle');
        }
    };

    const startEdit = (car) => {
        setIsEditing(car.id);
        // Ensure models are loaded for this make
        if (car.make_id) fetchModels(car.make_id);

        setFormData({
            date: car.date,
            year: car.year,
            make_id: car.make_id,
            model_id: car.model_id,
            imageUrl: car.imageUrl,
            gameOverImageURL: car.gameOverImageURL,
            source: car.source,
            transformOrigin: car.transformOrigin,
            maxZoom: car.maxZoom,
            country: car.country,
            funFacts: car.funFacts
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setFormData({
            date: '',
            make_id: '',
            model_id: '',
            year: '',
            imageUrl: '',
            gameOverImageURL: '',
            source: '',
            transformOrigin: 'center center',
            maxZoom: 5,
            country: '',
            funFacts: ''
        });
        setIsEditing(null);
    };

    // Prevent rendering while loading auth or if not admin
    // Note: We wait for profileLoaded to distinguish between "not logged in" (isAdmin=false) and "not yet loaded"
    if (authLoading || !profileLoaded || !isAdmin) {
        return null; // Or a loading spinner
    }

    return (
        <div style={styles.container}>
            {(isSaving || isGeneratingHints) && (
                <div style={styles.loadingOverlay}>
                    <div style={styles.loadingBox}>
                        <div style={styles.spinner}></div>
                        <p>{isGeneratingHints ? 'Generating Hints with AI...' : 'Saving & Generating Crops...'}</p>
                        <p style={{ fontSize: '0.8rem', color: '#ccc' }}>
                            {isGeneratingHints ? 'This may take upward of 10s.' : 'This may take a few seconds.'}
                        </p>
                    </div>
                </div>
            )}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                {isLoading && <p>Loading data...</p>}
            </div>

            {/* Date Filter Section */}
            <section style={styles.filterSection}>
                <div style={styles.filterRow}>
                    <div style={styles.filterField}>
                        <label style={styles.filterLabel}>Start Date:</label>
                        <input
                            type="date"
                            value={filterStartDate}
                            onChange={(e) => setFilterStartDate(e.target.value)}
                            style={styles.filterInput}
                        />
                    </div>
                    <div style={styles.filterField}>
                        <label style={styles.filterLabel}>End Date:</label>
                        <input
                            type="date"
                            value={filterEndDate}
                            onChange={(e) => setFilterEndDate(e.target.value)}
                            style={styles.filterInput}
                        />
                    </div>
                    <button
                        onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
                        style={styles.clearButton}
                    >
                        Clear Filter
                    </button>
                    <button
                        onClick={() => { setFilterStartDate(getNYDateString(0)); setFilterEndDate(getNYDateString(30)); }}
                        style={styles.resetButton}
                    >
                        Reset to Next 30 Days
                    </button>
                    <span style={{ marginLeft: 'auto', color: '#000', alignSelf: 'center', fontWeight: 'bold' }}>
                        {filteredPuzzles.length} results
                    </span>
                </div>
            </section>

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
                                <input type="number" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} required style={styles.crudInput} />
                            </div>
                        </div>

                        <div style={styles.formRow}>
                            <div style={styles.field}>
                                <label style={styles.label}>Make:</label>
                                <select
                                    value={formData.make_id}
                                    onChange={e => setFormData({ ...formData, make_id: e.target.value, model_id: '' })}
                                    required
                                    style={styles.crudInput}
                                >
                                    <option value="">Select Make</option>
                                    {makes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Model:</label>
                                <select
                                    value={formData.model_id}
                                    onChange={e => setFormData({ ...formData, model_id: e.target.value })}
                                    required
                                    style={styles.crudInput}
                                    disabled={!formData.make_id}
                                >
                                    <option value="">Select Model</option>
                                    {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
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
                                <label style={styles.label}>
                                    Country Code (2-letter):
                                    <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: '#666' }}>
                                        {formData.country && <img src={`https://flagcdn.com/h20/${formData.country.toLowerCase()}.png`} alt="flag" style={{ verticalAlign: 'middle' }} />}
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    maxLength="2"
                                    value={formData.country}
                                    onChange={e => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
                                    placeholder="US, JP, DE..."
                                    style={styles.crudInput}
                                />
                            </div>
                            <div style={{ ...styles.field, flex: 2 }}>
                                <label style={styles.label}>
                                    Fun Facts (Bullet points):
                                    <button
                                        type="button"
                                        onClick={generateHints}
                                        style={{ ...styles.addButton, padding: '2px 8px', fontSize: '0.7rem', marginLeft: '10px', float: 'right' }}
                                    >
                                        ✨ Auto-Fill with AI
                                    </button>
                                </label>
                                <textarea
                                    rows="4"
                                    value={formData.funFacts}
                                    onChange={e => setFormData({ ...formData, funFacts: e.target.value })}
                                    style={{ ...styles.crudInput, resize: 'vertical' }}
                                />
                            </div>
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>Image Source / Credit URL:</label>
                            <input type="url" value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })} placeholder="https://..." required style={styles.crudInput} />
                        </div>

                        <div style={styles.formRow}>
                            <div style={styles.field}>
                                <label style={styles.label}>Max Zoom (Guess #1): {formData.maxZoom}</label>
                                <input type="range" min="1" max="10" step="0.1" value={formData.maxZoom} onChange={e => setFormData({ ...formData, maxZoom: e.target.value })} style={styles.rangeInput} />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Transform Origin (X% Y%):</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ minWidth: '30px', fontSize: '0.8rem' }}>X:</span>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="1"
                                            value={parseInt((formData.transformOrigin || '50% 50%').split(' ')[0]) || 50}
                                            onChange={(e) => {
                                                const currentY = (formData.transformOrigin || '50% 50%').split(' ')[1] || '50%';
                                                setFormData({ ...formData, transformOrigin: `${e.target.value}% ${currentY}` });
                                            }}
                                            style={{ flex: 1 }}
                                        />
                                        <span style={{ minWidth: '40px', fontSize: '0.8rem', textAlign: 'right' }}>
                                            {(formData.transformOrigin || '50% 50%').split(' ')[0]}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ minWidth: '30px', fontSize: '0.8rem' }}>Y:</span>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="1"
                                            value={parseInt((formData.transformOrigin || '50% 50%').split(' ')[1]) || 50}
                                            onChange={(e) => {
                                                const currentX = (formData.transformOrigin || '50% 50%').split(' ')[0] || '50%';
                                                setFormData({ ...formData, transformOrigin: `${currentX} ${e.target.value}%` });
                                            }}
                                            style={{ flex: 1 }}
                                        />
                                        <span style={{ minWidth: '40px', fontSize: '0.8rem', textAlign: 'right' }}>
                                            {(formData.transformOrigin || '50% 50%').split(' ')[1]}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={styles.previewContainer}>
                            <h3 style={styles.previewTitle}>Live Crop Preview (Guess #1 Zoom)</h3>
                            <div style={styles.previewWrapper}>
                                <ImageDisplay
                                    imageUrl={formData.imageUrl}
                                    zoomLevel={0} // Stage 0 (Start of Game)
                                    gameStatus='playing'
                                    transformOrigin={formData.transformOrigin}
                                    maxZoom={formData.maxZoom}
                                    useClientSideZoom={true} // Enable legacy zoom for preview
                                />
                            </div>
                        </div>

                        <div style={styles.formActions}>
                            <button type="submit" style={styles.saveButton}>
                                {isEditing ? 'Save Changes' : 'Create Puzzle'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setShowAddForm(false); setIsEditing(null); resetForm(); }}
                                style={styles.cancelButton}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <div style={styles.grid}>
                {filteredPuzzles.map((car) => (
                    <div key={car.id || car.date} style={styles.card}>
                        <div style={styles.imageContainer}>
                            <div style={styles.imageContainer}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {/* Left: Full Source Image (Scaled down) */}
                                    <ImageDisplay
                                        imageUrl={car.imageUrl}
                                        zoomLevel={1}
                                        gameStatus='completed' // Forces full view
                                        transformOrigin={car.transformOrigin}
                                        maxZoom={car.maxZoom}
                                        useClientSideZoom={true} // Use CSS logic to show full image in small frame? Actually gameStatus='completed' returns scale 1.
                                        // If useClientSideZoom=false, it just fills container. That's fine for source.
                                        // Actually, if we want to ensure it shows KEY features, we might want objectFit 'contain'? 
                                        // But ImageDisplay enforces 'cover'.
                                        width="130px"
                                        height="87px"
                                        clickable={false}
                                    />
                                    {/* Right: Server-Side Crop (Stage 0 / Guess #1) */}
                                    <ImageDisplay
                                        imageUrl={`${supabaseUrl}/functions/v1/serve-crop?id=${car.id}&stage=0&token=${session?.access_token}`} // Removed cache buster
                                        zoomLevel={1}
                                        gameStatus='playing'
                                        transformOrigin={car.transformOrigin}
                                        maxZoom={car.maxZoom}
                                        useClientSideZoom={false} // Use the actual crop
                                        width="130px"
                                        height="87px"
                                        clickable={false}
                                    />
                                </div>
                            </div>
                        </div>
                        <div style={styles.metadata}>
                            <strong>ID:</strong> {car.id}<br />
                            <strong>Date:</strong> {car.date}<br />
                            <strong>Car:</strong> {car.year} {car.make} {car.model}
                            {car.country && (
                                <img
                                    src={`https://flagcdn.com/h20/${car.country.toLowerCase()}.png`}
                                    alt={car.country}
                                    title={car.country}
                                    style={{ marginLeft: '6px', verticalAlign: 'middle', height: '14px' }}
                                />
                            )}
                            <br />
                            <a href={car.imageUrl} target="_blank" rel="noopener noreferrer" style={styles.link}>
                                Source Image
                            </a>
                            {car.source && (
                                <>
                                    {' | '}
                                    <a href={car.source} target="_blank" rel="noopener noreferrer" style={styles.link}>
                                        Credit
                                    </a>
                                </>
                            )}
                            {car.gameOverImageURL && (
                                <>
                                    {' | '}
                                    <a href={car.gameOverImageURL} target="_blank" rel="noopener noreferrer" style={styles.link}>
                                        Reveal Image
                                    </a>
                                </>
                            )}
                            <div style={styles.cardActions}>
                                <button onClick={() => startEdit(car)} style={styles.editButton}>Edit</button>
                                <button onClick={() => handleDelete(car.id)} style={styles.deleteButton}>Remove</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={styles.adminControls}>
                <button
                    onClick={() => {
                        setShowAddForm(true);
                        setIsEditing(null);
                        resetForm();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={styles.addButton}
                >
                    + Add New Daily Car
                </button>
            </div>

            <section style={styles.summarySection}>
                <div
                    onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                    style={{ ...styles.subTitle, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                    Car Distribution Summary
                    <span style={{ fontSize: '0.8rem', color: '#a3f7bf' }}>
                        {isSummaryExpanded ? '▼' : '▶'}
                    </span>
                </div>

                {isSummaryExpanded && (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Make</th>
                                <th style={styles.th}>Model</th>
                                <th style={styles.th}>Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            {distributionSummary.map((item, idx) => {
                                const key = `${item.make}|${item.model}`;
                                return (
                                    <tr key={key} style={styles.tr}>
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
                )}
            </section>
        </div >
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
        color: 'white',
        WebkitTextFillColor: 'white', // Override parent h1 transparent fill
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
        flexWrap: 'wrap', // Enable wrapping for mobile
    },
    field: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minWidth: '200px', // Ensure fields don't get too squashed before wrapping
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
        color: '#012062'
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
        flex: 2
    },
    cancelButton: {
        padding: '15px',
        backgroundColor: 'transparent',
        color: '#ccc',
        border: '1px solid #555',
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '1rem',
        cursor: 'pointer',
        flex: 1
    },
    formActions: {
        display: 'flex',
        gap: '15px',
        marginTop: '10px'
    },
    summarySection: {
        marginTop: '40px',
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
        background: 'rgba(144, 139, 139, 1)',
        border: '1px solid rgba(255, 255, 255)',
        borderRadius: '12px',
        padding: '15px',
        width: '280px',
        display: 'flex',
        flexDirection: 'column',
    },
    imageContainer: {
        marginBottom: '0px',
        borderRadius: '8px',
        overflow: 'hidden'
    },
    metadata: {
        width: '100%',
        fontSize: '0.85rem',
        color: '#0a0a0a',
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
    },
    filterSection: {
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'center'
    },
    filterRow: {
        display: 'flex',
        gap: '15px',
        alignItems: 'end',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: '15px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        flexWrap: 'wrap', // Enable wrapping for mobile
        justifyContent: 'center'
    },
    filterField: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
    },
    filterLabel: {
        fontSize: '0.8rem',
        color: '#000',
        fontWeight: 'bold'
    },
    filterInput: {
        padding: '8px',
        backgroundColor: '#16213e',
        border: '1px solid #0f3460',
        borderRadius: '4px',
        color: '#fff',
        fontSize: '0.9rem'
    },
    clearButton: {
        padding: '8px 12px',
        backgroundColor: 'transparent',
        color: '#ccc',
        border: '1px solid #555',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.8rem',
        height: '35px'
    },
    resetButton: {
        padding: '8px 12px',
        backgroundColor: '#0f3460',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.8rem',
        height: '35px'
    },
    loadingOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
    },
    loadingBox: {
        backgroundColor: '#16213e',
        padding: '30px',
        borderRadius: '12px',
        border: '1px solid #e94560',
        textAlign: 'center',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '15px'
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '4px solid rgba(255, 255, 255, 0.1)',
        borderLeftColor: '#e94560',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    }
};

// Add keyframes for spinner
// Add keyframes for spinner
// Styles injected via useEffect to avoid SSR reference error

export default ProofSheet;
