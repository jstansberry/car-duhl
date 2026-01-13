'use client';

import React, { useState } from 'react';
import ProofSheet from './ProofSheet';
import DailyWagerAdmin from './DailyWagerAdmin';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('grand-prix');

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <h1 style={{ marginBottom: '20px', textAlign: 'center' }}>Admin Dashboard</h1>

            <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '20px',
                borderBottom: '1px solid var(--glass-border)',
                paddingBottom: '10px'
            }}>
                <button
                    onClick={() => setActiveTab('grand-prix')}
                    style={{
                        background: activeTab === 'grand-prix' ? 'var(--primary-color)' : 'transparent',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-color)',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease'
                    }}
                >
                    Grand Prix
                </button>
                <button
                    onClick={() => setActiveTab('dailywager')}
                    style={{
                        background: activeTab === 'dailywager' ? 'var(--primary-color)' : 'transparent',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-color)',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease'
                    }}
                >
                    Daily Wager
                </button>
            </div>

            <div className="admin-content">
                {activeTab === 'grand-prix' && <ProofSheet />}
                {activeTab === 'dailywager' && <DailyWagerAdmin />}
            </div>
        </div>
    );
};

export default AdminDashboard;
