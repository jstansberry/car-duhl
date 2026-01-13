import React from 'react';

const AboutUs = () => {
    return (
        <div style={styles.container} className="glass-panel">
            <h1 style={styles.title}>About Us</h1>

            <section style={styles.section}>
                <h2 style={styles.heading}>Welcome to My Daily Garage</h2>
                <p>My Daily Garage is a daily game for car enthusiasts. Every day, we feature a new vehicle, and your challenge is to identify it. Each guess zooms out to reveal more of the car, testing your automotive knowledge.</p>
            </section>

            <section style={styles.section}>
                <h2 style={styles.heading}>Our Mission</h2>
                <p>Our goal is to create a fun, engaging community for car lovers to test their skills and learn about different vehicles from history and today.</p>
            </section>

            <section style={styles.section}>
                <h2 style={styles.heading}>The Team</h2>
                <p>My Daily Garage is built by a small team of passionate developers and car enthusiasts.</p>
            </section>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '800px',
        margin: '40px auto',
        padding: '30px',
        color: '#fff',
        textAlign: 'left',
        lineHeight: '1.6'
    },
    title: {
        fontSize: '2.5rem',
        marginBottom: '30px',
        color: '#ffffff'
    },
    section: {
        marginBottom: '20px'
    },
    heading: {
        fontSize: '1.5rem',
        marginBottom: '10px',
        color: '#ffffff',
        borderBottom: '1px solid #333',
        paddingBottom: '5px'
    }
};

export default AboutUs;
