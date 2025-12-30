import React from 'react';
import dailyCars from '../data/dailyCars.json';
import ImageDisplay from './ImageDisplay';

const ProofSheet = () => {
    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1>Proof Sheet</h1>
                <p>Reviewing {dailyCars.length} configured cars</p>
            </header>

            <div style={styles.grid}>
                {dailyCars.map((car, index) => (
                    <div key={index} style={styles.card}>
                        <div style={styles.imageContainer}>
                            {/* Force zoomLevel 1 (max zoom) to check the crop */}
                            <ImageDisplay
                                imageUrl={car.imageUrl}
                                zoomLevel={1}
                                gameStatus='playing'
                                transformOrigin={car.transformOrigin}
                                maxZoom={car.maxZoom}
                            />
                        </div>
                        <div style={styles.metadata}>
                            <strong>Date:</strong> {car.date}<br />
                            <strong>Car:</strong> {car.year} {car.make} {car.model}<br />
                            <strong>Origin:</strong> {car.transformOrigin || 'center center (default)'}<br />
                            <strong>Max Zoom:</strong> {car.maxZoom || 5}<br />
                            <a href={car.imageUrl} target="_blank" rel="noopener noreferrer" style={styles.link}>
                                View Source Image
                            </a>
                            {car.gameOverImageURL && (
                                <>
                                    <br />
                                    <a href={car.gameOverImageURL} target="_blank" rel="noopener noreferrer" style={{ ...styles.link, color: '#e94560' }}>
                                        View Reveal Image
                                    </a>
                                </>
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
    },
    header: {
        textAlign: 'center',
        marginBottom: '40px',
    },
    grid: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '40px',
        justifyContent: 'center'
    },
    card: {
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '20px',
        width: '320px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    imageContainer: {
        marginBottom: '15px',
        // We need to counteract the margin bottom currently in ImageDisplay's container style
        // but ImageDisplay's style is inline, so we just wrap it.
    },
    metadata: {
        width: '100%',
        fontSize: '0.9rem',
        color: '#ccc',
        lineHeight: '1.5'
    },
    link: {
        color: '#a3f7bf',
        textDecoration: 'none',
        fontSize: '0.8rem',
        display: 'inline-block',
        marginTop: '5px'
    }
};

export default ProofSheet;
