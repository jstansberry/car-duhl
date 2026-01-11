import React from 'react';

const InfoSection = () => {
    return (
        <section style={styles.container}>
            <div style={styles.content}>
                <h1 style={styles.title}>My Daily Garage: The Ultimate Daily Car Guessing Game</h1>

                <div style={styles.block}>
                    <p style={styles.text}>
                        Welcome to <strong>My Daily Garage</strong>, the premier daily challenge for automotive enthusiasts and car spotters alike.
                        Every day, we feature a new vehicle from automotive history—ranging from classic muscle cars and vintage roadsters to modern supercars and obscure JDM legends.
                    </p>
                </div>

                <div style={styles.block}>
                    <h2 style={styles.heading}>How to Play</h2>
                    <ul style={styles.list}>
                        <li style={styles.listItem}><strong>Guess the Car:</strong> You have 5 attempts to identify the Make, Model, and Year of the daily vehicle.</li>
                        <li style={styles.listItem}><strong>Visual Clues:</strong> Each game starts with a zoomed-in crop of a distinctive feature—a headlight, a fender vent, or a wheel arch.</li>
                        <li style={styles.listItem}><strong>Progressive Reveals:</strong> With each incorrect guess, the image zooms out, revealing more of the car to help you narrow down the answer.</li>
                        <li style={styles.listItem}><strong>Feedback System:</strong> Our smart feedback system tells you if you got the Make, Model, or Year correct (Green) or incorrect (Red) after each submission.</li>
                    </ul>
                </div>

                <div style={styles.block}>
                    <h2 style={styles.heading}>Why Play My Daily Garage?</h2>
                    <p style={styles.text}>
                        Whether you are studying for a car spotting competition or just love cars, My Daily Garage offers a fun, low-pressure way to test your knowledge.
                        Learn about production years, obscure models, and design evolutions. From the curves of a 1960s Ferrari to the sharp angles of 1980s boxy sedans, our diverse database covers it all.
                    </p>
                </div>

                <div style={styles.block}>
                    <h3 style={styles.subHeading}>Sharpen Your Automotive Knowledge</h3>
                    <p style={styles.text}>
                        Can you distinguish a 1969 Camaro from a 1968 based on the side marker lights? Do you know the difference between a Porsche 996 and 997 headlight?
                        My Daily Garage challenges you to look closer at the details that define automotive design.
                    </p>
                </div>

                <div style={styles.footer}>
                    <p style={styles.smallText}>
                        Daily challenges update at midnight Eastern Time and the Grand Prix ends at midnight Eastern Time.
                    </p>
                </div>
            </div>
        </section>
    );
};

const styles = {
    container: {
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: '#0f0f1a', // Very dark blue/black background to match theme
        color: '#ccc',
        padding: '40px 20px',
        marginTop: '60px',
        borderTop: '1px solid #333',
        display: 'flex',
        justifyContent: 'center'
    },
    content: {
        maxWidth: '800px',
        width: '100%',
        textAlign: 'left'
    },
    title: {
        fontSize: '1.8rem',
        color: '#e94560', // Theme Red
        marginBottom: '20px',
        borderBottom: '2px solid #333',
        paddingBottom: '10px'
    },
    heading: {
        fontSize: '1.4rem',
        color: '#fff',
        marginBottom: '10px',
        marginTop: '25px'
    },
    subHeading: {
        fontSize: '1.2rem',
        color: '#a3f7bf', // Theme Green/Mint
        marginBottom: '10px',
        marginTop: '20px'
    },
    block: {
        marginBottom: '20px'
    },
    text: {
        fontSize: '1rem',
        lineHeight: '1.6',
        color: '#d1d1d1'
    },
    list: {
        paddingLeft: '20px',
        lineHeight: '1.6'
    },
    listItem: {
        marginBottom: '8px',
        color: '#d1d1d1'
    },
    footer: {
        marginTop: '40px',
        borderTop: '1px solid #333',
        paddingTop: '20px',
        textAlign: 'center'
    },
    smallText: {
        fontSize: '0.8rem',
        color: '#666'
    }
};

export default InfoSection;
