import React from 'react'
import { useTranslation } from '../hooks/useTranslation'
import LanguageSelector from './LanguageSelector'

export default function Progress({ navigateTo }) {
  const { t } = useTranslation()
  
  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: 'clamp(10px, 3vw, 20px)',
      width: '100%',
      position: 'relative'
    }}>
      <LanguageSelector position="fixed" />
      
      {/* Back Button */}
      {navigateTo && (
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => navigateTo('welcome')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              background: '#f8f9fa',
              color: '#333',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.background = '#e9ecef'}
            onMouseOut={(e) => e.target.style.background = '#f8f9fa'}
          >
            <span>←</span>
            <span>{t('navigation.back_to_home')}</span>
          </button>
        </div>
      )}
      
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{
          fontSize: '24px',
          margin: '0 0 20px 0',
          color: '#333'
        }}>
          Progress Tracking
        </h2>
        <p style={{
          color: '#666',
          margin: 0
        }}>
          Progress tracking component will be implemented here. This will show your voice training progress, session history, and achievement milestones.
        </p>
      </div>
    </div>
  )
}