import React from 'react';

const ContactUs = () => {
    return (
        <div style={styles.container} className="glass-panel">
            <h1 style={styles.title}>Contact Us</h1>
            <p style={styles.date}>Last Updated: January 13, 2026</p>

            <section style={styles.section}>
                <h2 style={styles.heading}>Get in Touch</h2>
                <p>We value your feedback and are here to help with any questions or issues you may have regarding My Daily Garage.</p>
            </section>

            <section style={styles.section}>
                <h2 style={styles.heading}>Email Support</h2>
                <p>For support, inquiries, or feedback, please email us at:</p>
                <a href="mailto:support@mydailygarage.com" style={styles.link}>support@mydailygarage.com</a>
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
        marginBottom: '10px',
        color: '#ffffff'
    },
    date: {
        fontSize: '0.9rem',
        color: '#888',
        marginBottom: '30px'
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
    },
    link: {
        color: '#4a9eff',
        textDecoration: 'none',
        fontSize: '1.1rem'
    }
};

export default ContactUs;
