// src/components/Welcome.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSelector from './LanguageSelector';

// It receives the 'navigateTo' function as a prop from App.jsx
function Welcome({ navigateTo }) {
    const { t, language } = useTranslation();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // Dynamic workout guide link based on language
    const workoutGuideUrl = language === 'et' 
        ? './vocal_workout_et.html' 
        : './vocal_workout.html';
    return (
        <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            maxWidth: '600px',
            margin: '0 auto',
            textAlign: 'center'
        }}>
            <LanguageSelector position="fixed" />

            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ 
                    fontSize: 'clamp(2rem, 5vw, 3rem)', 
                    margin: '0 0 0.5rem 0', 
                    color: '#333',
                    fontWeight: '300'
                }}>
                    {t('app.title')}
                </h1>
                <h2 style={{ 
                    fontSize: 'clamp(1rem, 3vw, 1.25rem)', 
                    margin: '0', 
                    color: '#666',
                    fontWeight: '400'
                }}>
                    {t('app.subtitle')}
                </h2>
            </div>
            
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile 
                    ? '1fr' 
                    : 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem', 
                width: '100%',
                maxWidth: '600px',
                padding: '0 1rem'
            }}>
                <button 
                    onClick={() => navigateTo('morning-routine')} 
                    style={{ 
                        padding: '1.5rem 1rem', 
                        backgroundColor: '#28a745', 
                        color: 'white', 
                        border: 'none', 
                        cursor: 'pointer', 
                        borderRadius: '12px', 
                        fontSize: 'clamp(14px, 2.5vw, 16px)',
                        fontWeight: '500',
                        boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
                        transition: 'all 0.2s ease',
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)'
                        e.target.style.boxShadow = '0 6px 16px rgba(40, 167, 69, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)'
                        e.target.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)'
                    }}>
                    {t('routines.morning')}
                </button>
                <button 
                    onClick={() => navigateTo('evening-routine')} 
                    style={{ 
                        padding: '1.5rem 1rem', 
                        backgroundColor: '#FF9800', 
                        color: 'white', 
                        border: 'none', 
                        cursor: 'pointer', 
                        borderRadius: '12px', 
                        fontSize: 'clamp(14px, 2.5vw, 16px)',
                        fontWeight: '500',
                        boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)',
                        transition: 'all 0.2s ease',
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)'
                        e.target.style.boxShadow = '0 6px 16px rgba(255, 152, 0, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)'
                        e.target.style.boxShadow = '0 4px 12px rgba(255, 152, 0, 0.3)'
                    }}>
                    {t('routines.evening')}
                </button>
                <button 
                    onClick={() => navigateTo('weekend-routine')} 
                    style={{ 
                        padding: '1.5rem 1rem', 
                        backgroundColor: '#9C27B0', 
                        color: 'white', 
                        border: 'none', 
                        cursor: 'pointer', 
                        borderRadius: '12px', 
                        fontSize: 'clamp(14px, 2.5vw, 16px)',
                        fontWeight: '500',
                        boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)',
                        transition: 'all 0.2s ease',
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)'
                        e.target.style.boxShadow = '0 6px 16px rgba(156, 39, 176, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)'
                        e.target.style.boxShadow = '0 4px 12px rgba(156, 39, 176, 0.3)'
                    }}>
                    {t('routines.weekend')}
                </button>
                <button 
                    onClick={() => navigateTo('optional-routine')} 
                    style={{ 
                        padding: '1.5rem 1rem', 
                        backgroundColor: '#6c757d', 
                        color: 'white', 
                        border: 'none', 
                        cursor: 'pointer', 
                        borderRadius: '12px', 
                        fontSize: 'clamp(14px, 2.5vw, 16px)',
                        fontWeight: '500',
                        boxShadow: '0 4px 12px rgba(108, 117, 125, 0.3)',
                        transition: 'all 0.2s ease',
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)'
                        e.target.style.boxShadow = '0 6px 16px rgba(108, 117, 125, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)'
                        e.target.style.boxShadow = '0 4px 12px rgba(108, 117, 125, 0.3)'
                    }}>
                    {t('routines.optional')}
                </button>
                <button 
                    onClick={() => navigateTo('db-meter')} 
                    style={{ 
                        padding: '1.5rem 1rem', 
                        backgroundColor: '#007bff', 
                        color: 'white', 
                        border: 'none', 
                        cursor: 'pointer', 
                        borderRadius: '12px', 
                        fontSize: 'clamp(14px, 2.5vw, 16px)',
                        fontWeight: '500',
                        boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
                        transition: 'all 0.2s ease',
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)'
                        e.target.style.boxShadow = '0 6px 16px rgba(0, 123, 255, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)'
                        e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)'
                    }}>
                    {t('routines.measure')}
                </button>
                <a 
                    href={workoutGuideUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                        padding: '1.5rem 1rem', 
                        backgroundColor: '#6c5ce7', 
                        color: 'white', 
                        border: 'none', 
                        cursor: 'pointer', 
                        borderRadius: '12px', 
                        fontSize: 'clamp(14px, 2.5vw, 16px)',
                        fontWeight: '500',
                        boxShadow: '0 4px 12px rgba(108, 92, 231, 0.3)',
                        transition: 'all 0.2s ease',
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)'
                        e.target.style.boxShadow = '0 6px 16px rgba(108, 92, 231, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)'
                        e.target.style.boxShadow = '0 4px 12px rgba(108, 92, 231, 0.3)'
                    }}>
                    {t('routines.workout_guide')}
                </a>
            </div>
        </div>
    );
}

export default Welcome;