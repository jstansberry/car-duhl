import React from 'react';

const TermsOfService = () => {
    return (
        <div style={styles.container} className="glass-panel">
            <h1 style={styles.title}>Terms of Service</h1>
            <p style={styles.date}>Last Updated: January 16, 2026</p>

            <section style={styles.section}>
                <h2 style={styles.heading}>1. Acceptance of Terms</h2>
                <p>By accessing and using My Daily Garage, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our website.</p>
            </section>

            <section style={styles.section}>
                <h2 style={styles.heading}>2. Intellectual Property Rights</h2>
                <p>All content, features, and functionality of My Daily Garage, including but not limited to the codebase, design, text, graphics, and logos, are the exclusive property of <b>The Stansberry Group - My Daily Garage</b> and are protected by international copyright, trademark, and other intellectual property laws.</p>
                <p>You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our website without our prior written consent.</p>
            </section>

            <section style={styles.section}>
                <h2 style={styles.heading}>3. User Conduct</h2>
                <p>You agree not to use the website for any unlawful purpose or in any way that could damage, disable, overburden, or impair the site. You specifically agree not to:</p>
                <ul>
                    <li>Attempt to gain unauthorized access to any portion of the site or any other systems or networks connected to the site.</li>
                    <li>Use any robot, spider, or other automatic device, process, or means to access the site for any purpose, including monitoring or copying any of the material on the site.</li>
                    <li>Sell, resell, or exploit for any commercial purposes any portion of the site, use of the site, or access to the site.</li>
                </ul>
            </section>

            <section style={styles.section}>
                <h2 style={styles.heading}>4. Disclaimer of Warranties</h2>
                <p>The website is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, expressed or implied, regarding the operation of the site or the information, content, or materials included on the site.</p>
            </section>

            <section style={styles.section}>
                <h2 style={styles.heading}>5. Limitation of Liability</h2>
                <p>In no event shall The Stansberry Group - My Daily Garage be liable for any damages of any kind arising from the use of this site, including but not limited to direct, indirect, incidental, punitive, and consequential damages.</p>
            </section>

            <section style={styles.section}>
                <h2 style={styles.heading}>6. Contact Information</h2>
                <p>If you have any questions about these Terms of Service, please contact us at <a href="mailto:support@mydailygarage.com" style={styles.link}>support@mydailygarage.com</a>.</p>
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
    },
    link: {
        color: '#4a9eff',
        textDecoration: 'none'
    }
};

export default TermsOfService;
