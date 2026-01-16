import React from 'react';

const PrivacyPolicy = () => {
    return (
        <div style={styles.container} className="glass-panel">
            <h1 style={styles.title}>Privacy Policy</h1>
            <p style={styles.date}>Last Updated: January 9, 2026</p>

            <section style={styles.section}>
                <h2 style={styles.heading}>1. Introduction</h2>
                <p>Welcome to My Daily Garage. We value your privacy and are committed to protecting your personal data.</p>
            </section>

            <section style={styles.section}>
                <h2 style={styles.heading}>2. Data We Collect</h2>
                <p>We only collect information necessary to provide you with the best gaming experience. This includes:</p>
                <ul>
                    <li><b>Identity Data:</b> When you sign in with Google, we receive your name and email address.</li>
                    <li><b>Game Progress:</b> We store your daily guesses and scores to provide leaderboards and history.</li>
                </ul>
            </section>

            <section style={styles.section}>
                <h2 style={styles.heading}>3. How We Use Your Data</h2>
                <p>We use your data strictly for:</p>
                <ul>
                    <li>Authenticating your session via Google Login.</li>
                    <li>Saving and displaying your daily game progress.</li>
                    <li>Generating the Grand Prix Leaderboard.</li>
                </ul>
                <p>We do <b>not</b> sell your data to third parties or use it for marketing purposes.</p>
            </section>

            <section style={styles.section}>
                <h2 style={styles.heading}>4. Third-Party Services</h2>
                <p>We use the following third-party services:</p>
                <ul>
                    <li><b>Supabase:</b> For database storage and authentication management.</li>
                    <li><b>Google:</b> For identity verification (Google Login).</li>
                </ul>
            </section>

            <section style={styles.section}>
                <h2 style={styles.heading}>5. Data Retention</h2>
                <p>We retain your game scores and progress as long as your account is active. You may request data deletion at any time by contacting us.</p>
            </section>

            <section style={styles.section}>
                <h2 style={styles.heading}>6. Contact Us</h2>
                <p>If you have any questions about this Privacy Policy, please contact us at support@mydailygarage.com.</p>
            </section>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '800px',
        margin: '40px auto',
        padding: '30px',
        color: '#000',
        textAlign: 'left',
        lineHeight: '1.6'
    },
    title: {
        fontSize: '2.5rem',
        marginBottom: '10px',
        color: '#000'
    },
    date: {
        fontSize: '0.9rem',
        color: '#666',
        marginBottom: '30px'
    },
    section: {
        marginBottom: '20px'
    },
    heading: {
        fontSize: '1.5rem',
        marginBottom: '10px',
        color: '#000',
        borderBottom: '1px solid #333',
        paddingBottom: '5px'
    }
};

export default PrivacyPolicy;
