export default function Disclaimer({ onAgree }) {
  return (
    <div style={{ padding: '30px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Voice Coach App - Disclaimer</h2>
      <p style={{ marginBottom: '20px', lineHeight: 1.5 }}>
        This app is for vocal training purposes only. Please consult a healthcare professional 
        if you experience any discomfort. The app measures sound levels and provides breathing exercises.
      </p>
      <button 
        onClick={onAgree}
        style={{
          padding: '12px 24px',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        I Understand - Continue
      </button>
    </div>
  )
}