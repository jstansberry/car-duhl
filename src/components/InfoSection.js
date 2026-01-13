import React from 'react';

const InfoSection = () => {
    return (
        <section style={styles.container}>
            <div style={styles.content}>
                <h1 style={styles.title}>My Daily Garage: The Ultimate Daily Car Games</h1>

                <div style={styles.block}>
                    <p style={styles.text}>
                        Welcome to <strong>My Daily Garage</strong>, the ultimate destination for automotive enthusiasts.
                        We offer a <strong>suite of games oriented around car culture</strong>, designed to test your knowledge and market intuition.
                        From visual identification in "The Grand Prix" to valuation skills in "The Daily Wager", there is a challenge for every gearhead.
                    </p>
                </div>

                <div style={styles.block}>
                    <h2 style={styles.heading}>Our Mission</h2>
                    <p style={styles.text}>
                        My Daily Garage is more than just a game—it’s a celebration of automotive history and culture.
                        Our goal is to get people excited about the stories behind the machines, educating players on the
                        <strong> facts, figures, and rare models</strong> that have shaped the industry.
                    </p>
                </div>

                <div style={styles.block}>
                    <h2 style={styles.heading}>Explore Car Culture</h2>
                    <p style={styles.text}>
                        From the ever-changing valuations of collector cars to the engineering marvels of the past century,
                        we highlight <strong>exceptional examples</strong> of vehicles that were influential in the global market.
                        Whether you are tracking market trends or admiring design evolution, there is always something new to learn.
                    </p>
                    <ul style={styles.list}>
                        <li style={styles.listItem}>Discover influential models from every era.</li>
                        <li style={styles.listItem}>Understand the "why" behind vehicle valuations.</li>
                        <li style={styles.listItem}>Test your knowledge of obscure statistics and design details.</li>
                    </ul>
                </div>

                <div style={styles.block}>
                    <h3 style={styles.subHeading}>A Suite of Automotive Challenges</h3>
                    <p style={styles.text}>
                        We offer a variety of games designed to test different aspects of your gearhead knowledge.
                        Whether it’s visual identification or market price prediction, My Daily Garage is the ultimate playground for car lovers.
                    </p>
                </div>

                <div style={styles.footer}>
                    <p style={styles.smallText}>
                        Daily challenges update at midnight Eastern Time and the Grand Prix ends at midnight Sunday Eastern Time.
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
