import React, { useState, useEffect } from 'react';

const ImageDisplay = ({
    imageUrl,
    zoomLevel,
    gameStatus,
    transformOrigin,
    maxZoom,
    useClientSideZoom = false,
    width = '300px',
    height = '200px',
    clickable = true
}) => {
    const [isEnlarged, setIsEnlarged] = useState(false);
    const [currentUrl, setCurrentUrl] = useState(imageUrl);
    const [prevUrl, setPrevUrl] = useState(null);

    // Sync prop with state and manage transition history
    useEffect(() => {
        if (imageUrl !== currentUrl) {
            setPrevUrl(currentUrl);
            setCurrentUrl(imageUrl);

            // Clean up previous image after transition
            const timer = setTimeout(() => {
                setPrevUrl(null);
            }, 800); // Matches CSS animation duration
            return () => clearTimeout(timer);
        }
    }, [imageUrl, currentUrl]);

    // Legacy Client-Side Zoom (for Admin ProofSheet preview)
    const getScale = () => {
        if (!useClientSideZoom) return 1;
        if (gameStatus !== 'playing') return 1;

        const guessCount = zoomLevel;
        let scale = maxZoom || 5;
        let currentReduction = 0.90;
        const progression = 0.025;

        for (let i = 0; i < guessCount; i++) {
            scale = scale * currentReduction;
            currentReduction -= progression;
        }

        return Math.max(scale, 1);
    };

    const currentScale = getScale();

    const toggleEnlarge = () => {
        if (!clickable) return;
        setIsEnlarged(!isEnlarged);
    };

    return (
        <div style={styles.container}>
            <div
                style={{
                    ...styles.imageWrapper,
                    width: width,
                    height: height,
                    cursor: clickable ? 'pointer' : 'default',
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
                    position: 'relative' // Ensure absolute children are contained
                }}>
                    {/* Render Previous Image (Fading Out/Background) */}
                    {!useClientSideZoom && prevUrl && (
                        <img
                            src={prevUrl}
                            alt="Previous view"
                            style={{
                                ...styles.image,
                                width: '100%',
                                height: '100%',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                objectFit: 'cover',
                                pointerEvents: 'none',
                                zIndex: 1
                            }}
                        />
                    )}

                    {/* Render Current Image (Fading In) */}
                    <img
                        key={currentUrl} // Key change triggers animation
                        src={currentUrl}
                        alt="Guess the car"
                        draggable="false"
                        onDragStart={(e) => e.preventDefault()}
                        onContextMenu={(e) => e.preventDefault()}
                        style={{
                            ...styles.image,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            pointerEvents: 'none',
                            // Conditional Styling:
                            ...(useClientSideZoom ? {
                                transform: `scale(${currentScale})`,
                                transformOrigin: transformOrigin || 'center center',
                            } : {
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                zIndex: 2,
                                animation: prevUrl ? 'softFadeIn 0.8s ease-in-out' : 'none'
                            })
                        }}
                    />
                </div>
            </div>
            {clickable && (
                <div style={styles.hint}>
                    Click image to enlarge
                </div>
            )}
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
        backgroundColor: '#767676',
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

// Add generic fade in keyframes
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes softFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
`;
document.head.appendChild(styleSheet);
