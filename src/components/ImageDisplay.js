import React, { useState } from 'react';

const ImageDisplay = ({ imageUrl, zoomLevel, gameStatus, transformOrigin, maxZoom }) => {
    const [isEnlarged, setIsEnlarged] = useState(false);

    // Zoom levels: 1 (closest) to 5 (furthest/full image)
    const getScale = () => {
        // If we lost or won (game over), show full image
        if (gameStatus !== 'playing') return 1;

        // Start at 5x scale, or custom maxZoom
        // Decrease by ~20% for each incorrect guess (was 30%)
        const initialScale = maxZoom || 5;
        const reductionFactor = 0.8;
        // zoomLevel starts at 1, so index is zoomLevel - 1
        let scale = initialScale * Math.pow(reductionFactor, zoomLevel - 1);

        return Math.max(scale, 1);
    };

    const toggleEnlarge = () => {
        setIsEnlarged(!isEnlarged);
    };

    const currentScale = getScale();

    return (
        <div style={styles.container}>
            <div
                style={{
                    ...styles.imageWrapper,
                    cursor: 'pointer',
                    transform: isEnlarged ? 'scale(1.5)' : 'scale(1)',
                    transition: 'transform 0.3s ease-in-out',
                    zIndex: isEnlarged ? 100 : 1
                }}
                onClick={toggleEnlarge}
            >
                <div style={{
                    ...styles.cropFrame,
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                }}>
                    <img
                        src={imageUrl}
                        alt="Guess the car"
                        draggable="false"
                        onDragStart={(e) => e.preventDefault()}
                        onContextMenu={(e) => e.preventDefault()}
                        style={{
                            ...styles.image,
                            transform: `scale(${currentScale})`,
                            // Use custom transform origin if provided, otherwise default to center
                            transformOrigin: transformOrigin || 'center center',
                            pointerEvents: 'none', // Allow clicks to pass through to wrapper, prevents dragging interaction
                        }}
                    />
                </div>
            </div>
            <div style={styles.hint}>
                Click image to enlarge
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '20px',
    },
    imageWrapper: {
        width: '300px',
        height: '200px',
        overflow: 'hidden',
        border: '2px solid #ccc',
        borderRadius: '8px',
        position: 'relative',
        backgroundColor: '#000',
    },
    cropFrame: {
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover', // Or contain, depending on source image quality
        transition: 'transform 0.5s ease',
    },
    hint: {
        marginTop: '8px',
        fontSize: '0.8rem',
        color: '#FFFFFF',
    }
};

export default ImageDisplay;
