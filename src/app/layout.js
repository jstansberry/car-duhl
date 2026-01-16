import '../index.css';
import Header from '../components/Header';
import InfoSection from '../components/InfoSection';
import { Analytics } from '@vercel/analytics/react';
import { Providers } from './providers';

export const metadata = {
    title: 'My Daily Garage: the daily guessing game',
    description: '5 guesses to nail the auto down. Each guess zooms out on the main image.',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <Providers>
                    <div className="app-wrapper">
                        <Header />
                        {children}
                        <InfoSection />
                        <Analytics />
                        <footer className="app-footer">
                            <div className="footer-content">
                                <span>&copy; 2026 My Daily Garage</span>
                                <a href="/privacy" className="footer-link">Privacy Policy</a>
                                <a href="/terms" className="footer-link">Terms of Service</a>
                                <a href="/contact" className="footer-link">Contact Us</a>
                                <a href="/about" className="footer-link">About Us</a>
                                <a href="/" className="footer-link">Home</a>
                            </div>
                        </footer>
                    </div>
                </Providers>
            </body>
        </html>
    );
}
