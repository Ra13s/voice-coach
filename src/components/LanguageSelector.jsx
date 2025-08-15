import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { languages } from '../locales';

function LanguageSelector({ position = 'fixed' }) {
    const { language, setLanguage } = useTranslation();

    const positionStyles = position === 'fixed' ? {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000
    } : {
        position: 'absolute',
        top: '16px',
        right: '16px',
        zIndex: 10
    };

    return (
        <div style={positionStyles}>
            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '2px solid #ddd',
                    backgroundColor: 'white',
                    fontSize: '14px',
                    cursor: 'pointer',
                    outline: 'none',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    minWidth: '120px'
                }}
            >
                {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.nativeName}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default LanguageSelector;