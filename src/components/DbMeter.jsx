import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from '../hooks/useTranslation'
import LanguageSelector from './LanguageSelector'
import * as Tone from 'tone'

// Audio measurement hook using Tone.js for professional-grade metering
export function useAudioMeter() {
  const [isRecording, setIsRecording] = useState(false)
  const [dbValue, setDbValue] = useState(0)
  const [peakDb, setPeakDb] = useState(0)
  const [avgDb, setAvgDb] = useState(0)
  const [minDb, setMinDb] = useState(Infinity)
  const [error, setError] = useState(null)
  
  const micRef = useRef(null)
  const meterRef = useRef(null)
  const animationRef = useRef(null)
  const measurementsRef = useRef([])
  const dbHistoryRef = useRef([])
  const isRecordingRef = useRef(false)

  const initAudio = useCallback(async () => {
    try {
      console.log('🎤 Initializing Tone.js audio system...')
      
      // Start Tone.js audio context
      await Tone.start()
      console.log('🎤 Tone.js started, context state:', Tone.getContext().state)
      
      // Create microphone input
      micRef.current = new Tone.UserMedia()
      await micRef.current.open()
      console.log('🎤 Microphone access granted')
      
      // Create meter for level measurement
      meterRef.current = new Tone.Meter()
      micRef.current.connect(meterRef.current)
      
      console.log('🎤 Tone.js audio processing setup complete')
      setError(null)
      
      return true
    } catch (error) {
      console.error('🎤 Tone.js microphone access error:', error)
      setError('Microphone access denied. Please allow microphone permissions.')
      return false
    }
  }, [])

  const calculateDb = () => {
    if (!meterRef.current) return 30
    
    // Get current level from Tone.js meter (-Infinity to 0 dBFS)
    const level = meterRef.current.getValue()
    
    // Convert dBFS to approximate SPL using device-specific calibration
    // Tone.js returns -Infinity for silence, handle this case
    if (level === -Infinity || level < -80) {
      return 30 // Silence/room tone level
    }
    
    // Device-specific calibration offsets based on empirical testing
    // Mobile devices typically read ~20 dB higher than desktop due to AGC and mic sensitivity
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const isMobileDevice = isMobile || isTouch
    
    // Calibration based on your observations:
    // Mobile: 62-71 dB for room tone, Desktop: 44-45 dB for same room
    // This means mobile needs ~17-26 dB less offset than desktop
    const DESKTOP_CALIBRATION = 110 // Original calibration for desktop
    const MOBILE_CALIBRATION = 88   // Reduced for mobile (110 - 22 = 88)
    
    const baseCalibrationOffset = isMobileDevice ? MOBILE_CALIBRATION : DESKTOP_CALIBRATION
    
    // Apply user calibration adjustment from localStorage (get fresh value each time)
    const userAdjustment = parseFloat(localStorage.getItem('voice-coach-calibration') || '0')
    const finalCalibrationOffset = baseCalibrationOffset + userAdjustment
    
    const db = level + finalCalibrationOffset
    
    // Optional: Log for debugging
    if (Math.random() < 0.05) { // Log 5% of the time for debugging
      console.log('🎤 Calibration:', { 
        rawLevel: level.toFixed(2),
        device: isMobileDevice ? 'mobile' : 'desktop',
        baseOffset: baseCalibrationOffset,
        userAdjust: userAdjustment,
        finalOffset: finalCalibrationOffset,
        calibratedDb: db.toFixed(1)
      })
    }
    
    return Math.max(30, Math.min(100, db))
  }

  const updateMeter = useCallback(() => {
    if (!meterRef.current || !isRecordingRef.current) {
      return
    }
    
    // Get current dB reading from Tone.js meter
    const instantDb = calculateDb()
    
    // Smooth the dB reading using a half-second rolling average
    // Assuming ~60fps, we want about 30 samples for 0.5 seconds
    const timestamp = Date.now()
    
    // Add current reading with timestamp
    dbHistoryRef.current.push({ db: instantDb, time: timestamp })
    
    // Remove readings older than 500ms (half second)
    dbHistoryRef.current = dbHistoryRef.current.filter(reading => 
      timestamp - reading.time <= 500
    )
    
    // Calculate weighted average (more recent readings have slightly more weight)
    let totalWeight = 0
    let weightedSum = 0
    
    dbHistoryRef.current.forEach((reading, index) => {
      const age = timestamp - reading.time
      const weight = Math.max(0.3, 1 - (age / 500)) // Weight from 0.3 to 1.0
      weightedSum += reading.db * weight
      totalWeight += weight
    })
    
    const smoothedDb = totalWeight > 0 ? weightedSum / totalWeight : instantDb
    setDbValue(Math.round(smoothedDb))
    
    // Track measurements for statistics - only include actual voice, not silence
    if (smoothedDb > 40) { // Only count readings above silence/room tone threshold
      measurementsRef.current.push(smoothedDb)
      
      // Update peak (responsive to actual peaks)
      if (instantDb > peakDb) {
        setPeakDb(Math.round(instantDb))
      }
      
      // Update minimum (use smoothed for stability) - only for actual voice
      if (smoothedDb < minDb) {
        setMinDb(Math.round(smoothedDb))
      }
      
      // Update average - only includes voice measurements, not silence
      if (measurementsRef.current.length > 0) {
        const avg = measurementsRef.current.reduce((a, b) => a + b, 0) / measurementsRef.current.length
        setAvgDb(Math.round(avg))
      }
    }
    
    animationRef.current = requestAnimationFrame(updateMeter)
  }, [peakDb, minDb]) // Removed calculateDb dependency since it's no longer memoized

  const startRecording = useCallback(async () => {
    if (!micRef.current) {
      const success = await initAudio()
      if (!success) return false
    }
    
    console.log('🎤 Starting Tone.js recording...')
    setIsRecording(true)
    isRecordingRef.current = true
    
    // Start the meter loop
    updateMeter()
    return true
  }, [initAudio, updateMeter])

  const stopRecording = useCallback(() => {
    setIsRecording(false)
    isRecordingRef.current = false // Update ref immediately
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  const resetMeasurement = useCallback(() => {
    measurementsRef.current = []
    dbHistoryRef.current = [] // Now stores objects with {db, time}
    setPeakDb(0)
    setAvgDb(0) 
    setMinDb(Infinity)
    setDbValue(0)
  }, [])

  const saveMeasurement = useCallback(() => {
    if (peakDb === 0 || avgDb === 0) return null
    
    const measurement = {
      timestamp: new Date().toISOString(),
      peak: peakDb,
      average: avgDb,
      minimum: minDb === Infinity ? 0 : minDb,
      date: new Date().toLocaleDateString()
    }
    
    // Save to localStorage
    const existingData = JSON.parse(localStorage.getItem('voiceCoachMeasurements') || '[]')
    existingData.push(measurement)
    localStorage.setItem('voiceCoachMeasurements', JSON.stringify(existingData))
    
    return measurement
  }, [peakDb, avgDb, minDb])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (micRef.current) {
        micRef.current.close()
      }
      if (meterRef.current) {
        meterRef.current.dispose()
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return {
    isRecording,
    dbValue,
    peakDb,
    avgDb,
    minDb: minDb === Infinity ? 0 : minDb,
    error,
    startRecording,
    stopRecording,
    resetMeasurement,
    saveMeasurement
  }
}

// DbMeter component with prop interface (following contract)
// PropTypes interface: { onDbChange?: (db: number) => void; className?: string; compact?: boolean; navigateTo?: (view: string) => void }
export default function DbMeter({ onDbChange, className = '', compact = false, navigateTo }) {
  const { t } = useTranslation()
  const [sessionLog, setSessionLog] = useState([])
  const [calibrationAdjust, setCalibrationAdjust] = useState(() => {
    return parseFloat(localStorage.getItem('voice-coach-calibration') || '0')
  })
  const [showCalibration, setShowCalibration] = useState(true) // Open by default
  
  const {
    isRecording,
    dbValue,
    peakDb,
    avgDb,
    minDb,
    error,
    startRecording,
    stopRecording,
    resetMeasurement,
    saveMeasurement
  } = useAudioMeter()

  // Load session log on mount
  useEffect(() => {
    const savedLog = localStorage.getItem('voiceCoachMeasurements')
    if (savedLog) {
      setSessionLog(JSON.parse(savedLog))
    }
  }, [])

  // Notify parent of dB changes
  useEffect(() => {
    if (onDbChange && dbValue > 0) {
      onDbChange(dbValue)
    }
  }, [dbValue, onDbChange])

  const handleToggle = async () => {
    if (isRecording) {
      stopRecording()
    } else {
      await startRecording()
    }
  }

  const handleSaveMeasurement = () => {
    const measurement = saveMeasurement()
    if (measurement) {
      setSessionLog(prev => [...prev, measurement])
    }
  }

  const clearLog = () => {
    if (sessionLog.length === 0) {
      alert(t('dbmeter.log_already_empty'))
      return
    }
    
    if (confirm(t('dbmeter.confirm_clear_log', { count: sessionLog.length }))) {
      setSessionLog([])
      localStorage.removeItem('voiceCoachMeasurements')
    }
  }

  const handleCalibrationChange = (newAdjust) => {
    setCalibrationAdjust(newAdjust)
    localStorage.setItem('voice-coach-calibration', newAdjust.toString())
  }

  const resetCalibration = () => {
    handleCalibrationChange(0)
  }

  const getDbColor = (db) => {
    if (db < 50) return '#4CAF50'
    if (db < 60) return '#8BC34A'
    if (db < 70) return '#FFC107'
    if (db < 80) return '#FF9800'
    return '#F44336'
  }

  const getDbStatus = (db) => {
    if (db < 50) return t('dbmeter.very_quiet')
    if (db < 60) return t('dbmeter.quiet_conversation')
    if (db < 70) return t('dbmeter.normal_conversation')
    if (db < 80) return t('dbmeter.loud_voice')
    return t('dbmeter.very_loud_careful')
  }

  const meterWidth = Math.max(0, Math.min(100, ((dbValue - 30) / 70) * 100))

  // Compact mode for embedded use
  if (compact) {
    return (
      <div className={`db-meter-compact ${className}`} style={{ 
        background: '#f8f9fa', 
        borderRadius: '12px', 
        padding: '20px',
        maxWidth: '350px',
        margin: '0 auto'
      }}>
        {error && (
          <div style={{ 
            background: '#fee', 
            border: '1px solid #fcc',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '15px',
            color: '#c00',
            fontSize: '13px'
          }}>
            <strong>🎤 Microphone Permission Required</strong>
            <p style={{ marginTop: '5px' }}>{error}</p>
          </div>
        )}
        
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          <div style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            color: getDbColor(dbValue),
            transition: 'color 0.3s ease'
          }}>
            {dbValue || '--'}
            <span style={{ fontSize: '14px', color: '#999', marginLeft: '3px' }}>dB</span>
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>
            {isRecording ? getDbStatus(dbValue) : t('dbmeter.click_start_measuring')}
          </div>
        </div>

        <div style={{
          width: '100%',
          height: '20px',
          background: '#e9ecef',
          borderRadius: '10px',
          overflow: 'hidden',
          margin: '15px 0'
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #4CAF50 0%, #8BC34A 40%, #FFC107 60%, #FF9800 80%, #F44336 100%)',
            borderRadius: '10px',
            transition: 'width 0.1s ease-out',
            width: `${meterWidth}%`
          }} />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={handleToggle}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              background: isRecording 
                ? 'linear-gradient(135deg, #f44336 0%, #e91e63 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            {isRecording ? t('dbmeter.stop_measuring') : t('dbmeter.start_measuring')}
          </button>
          
          <button 
            onClick={resetMeasurement}
            disabled={!isRecording && peakDb === 0}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              background: '#fff',
              cursor: peakDb > 0 ? 'pointer' : 'not-allowed',
              opacity: peakDb > 0 ? 1 : 0.5,
              fontSize: '13px'
            }}
          >
            {t('dbmeter.reset')}
          </button>
        </div>
      </div>
    )
  }

  // Full mode with professional guidance
  return (
    <div className={`db-meter ${className}`} style={{ 
      maxWidth: '600px',
      margin: '0 auto',
      padding: 'clamp(15px, 3vw, 25px)'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: 'clamp(25px, 5vw, 40px)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
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
        
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ 
            fontSize: 'clamp(24px, 5vw, 32px)', 
            margin: '0 0 5px 0', 
            color: '#333' 
          }}>
            {t('dbmeter.title')}
          </h1>
          <p style={{ 
            fontSize: 'clamp(12px, 2.5vw, 14px)', 
            color: '#666', 
            margin: 0 
          }}>
            {t('dbmeter.subtitle')}
          </p>
        </div>

        {error && (
          <div style={{ 
            background: '#fee', 
            border: '1px solid #fcc',
            borderRadius: '12px',
            padding: '15px',
            marginBottom: '20px',
            color: '#c00'
          }}>
            <strong>🎤 {t('dbmeter.microphone_permission_required')}</strong>
            <p style={{ marginTop: '10px', fontSize: '13px', lineHeight: '1.5' }}>
              {t('dbmeter.permission_instructions')}<br/>
              1. {t('dbmeter.permission_step1')}<br/>
              2. {t('dbmeter.permission_step2')}<br/>
              3. {t('dbmeter.permission_step3')}<br/><br/>
              <em>{t('dbmeter.privacy_note')}</em>
            </p>
          </div>
        )}

        <div style={{
          background: '#f0f8ff',
          border: '1px solid #b3d9ff',
          borderRadius: '12px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{
              color: '#0066cc',
              fontSize: '14px',
              margin: 0
            }}>
              🎛️ {t('dbmeter.calibration_title')}
            </h3>
            <button 
              onClick={() => setShowCalibration(!showCalibration)}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                borderRadius: '6px',
                border: '1px solid #0066cc',
                background: showCalibration ? '#0066cc' : 'transparent',
                color: showCalibration ? 'white' : '#0066cc',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {showCalibration ? t('dbmeter.hide') : t('dbmeter.show')}
            </button>
          </div>
          
          {showCalibration && (
            <div>
              <div style={{
                background: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '8px',
                padding: '10px',
                marginBottom: '15px'
              }}>
                <h4 style={{ fontSize: '13px', margin: '0 0 8px 0', color: '#856404' }}>
                  📏 {t('dbmeter.reference_calibration')}
                </h4>
                <p style={{ fontSize: '12px', color: '#856404', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                  <strong>Step 1:</strong> {t('dbmeter.calibration_step1')}<br/>
                  <strong>Step 2:</strong> {t('dbmeter.calibration_step2')}<br/>
                  <strong>Step 3:</strong> {t('dbmeter.calibration_step3')}
                </p>
              </div>

              <div style={{ 
                background: '#f8f9fa', 
                border: '1px solid #dee2e6', 
                borderRadius: '8px', 
                padding: '12px',
                marginBottom: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{t('dbmeter.current_reading')}:</span>
                  <span style={{ 
                    fontSize: '16px', 
                    fontWeight: 'bold',
                    color: getDbColor(dbValue)
                  }}>
                    {dbValue || '--'} dB
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{t('dbmeter.target_quiet_room')}:</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#4CAF50' }}>35 dB</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', minWidth: '80px' }}>{t('dbmeter.calibration_label')}:</span>
                <input 
                  type="range"
                  min="-30"
                  max="30"
                  step="1"
                  value={calibrationAdjust}
                  onChange={(e) => handleCalibrationChange(parseInt(e.target.value))}
                  style={{
                    flex: 1,
                    height: '8px',
                    borderRadius: '4px',
                    background: '#ddd',
                    outline: 'none'
                  }}
                />
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  minWidth: '50px',
                  color: calibrationAdjust === 0 ? '#666' : (calibrationAdjust > 0 ? '#d32f2f' : '#2e7d32')
                }}>
                  {calibrationAdjust > 0 ? '+' : ''}{calibrationAdjust} dB
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <button 
                  onClick={() => handleCalibrationChange(calibrationAdjust - 5)}
                  style={{
                    padding: '6px 10px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    background: '#f8f9fa',
                    cursor: 'pointer'
                  }}
                >
                  -5 dB
                </button>
                <button 
                  onClick={() => handleCalibrationChange(calibrationAdjust - 1)}
                  style={{
                    padding: '6px 10px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    background: '#f8f9fa',
                    cursor: 'pointer'
                  }}
                >
                  -1 dB
                </button>
                <button 
                  onClick={() => handleCalibrationChange(calibrationAdjust + 1)}
                  style={{
                    padding: '6px 10px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    background: '#f8f9fa',
                    cursor: 'pointer'
                  }}
                >
                  +1 dB
                </button>
                <button 
                  onClick={() => handleCalibrationChange(calibrationAdjust + 5)}
                  style={{
                    padding: '6px 10px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    background: '#f8f9fa',
                    cursor: 'pointer'
                  }}
                >
                  +5 dB
                </button>
                <button 
                  onClick={resetCalibration}
                  disabled={calibrationAdjust === 0}
                  style={{
                    padding: '6px 10px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    background: calibrationAdjust === 0 ? '#f5f5f5' : '#fee',
                    color: calibrationAdjust === 0 ? '#999' : '#c00',
                    cursor: calibrationAdjust === 0 ? 'not-allowed' : 'pointer',
                    opacity: calibrationAdjust === 0 ? 0.5 : 1
                  }}
                >
                  Reset
                </button>
              </div>

              <div style={{
                background: '#e8f5e9',
                border: '1px solid #c3e6c3',
                borderRadius: '6px',
                padding: '8px',
                fontSize: '11px',
                color: '#2e7d32'
              }}>
                <strong>💡 {t('dbmeter.why_35db')}</strong> {t('dbmeter.why_35db_explanation')}
              </div>

              {calibrationAdjust !== 0 && (
                <p style={{ 
                  fontSize: '11px', 
                  color: '#666', 
                  margin: '8px 0 0 0',
                  fontStyle: 'italic',
                  textAlign: 'center'
                }}>
                  ✓ {t('dbmeter.calibration_saved')} ({calibrationAdjust > 0 ? '+' : ''}{calibrationAdjust} dB offset)
                </p>
              )}
            </div>
          )}
        </div>

        <div style={{
          background: '#e8f4ff',
          border: '1px solid #b3d9ff',
          borderRadius: '12px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h3 style={{
            color: '#0066cc',
            fontSize: '14px',
            margin: '0 0 8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            📏 {t('dbmeter.measurement_setup')}
          </h3>
          <p style={{
            fontSize: '13px',
            lineHeight: '1.5',
            color: '#333',
            margin: 0
          }}>
            {t('dbmeter.setup_instructions')}
          </p>
        </div>

        <div style={{
          background: '#f8f9fa',
          borderRadius: '16px',
          padding: '25px',
          marginBottom: '20px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ 
              fontSize: 'clamp(48px, 10vw, 72px)', 
              fontWeight: 'bold', 
              color: getDbColor(dbValue),
              transition: 'color 0.3s ease',
              lineHeight: 1
            }}>
              {dbValue || '--'}
              <span style={{ fontSize: 'clamp(16px, 3vw, 24px)', color: '#999', marginLeft: '5px' }}>dB</span>
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#666', 
              marginTop: '10px', 
              height: '20px' 
            }}>
              {isRecording ? getDbStatus(dbValue) : t('dbmeter.click_start_measuring')}
            </div>
          </div>

          <div style={{
            width: '100%',
            height: '40px',
            background: '#e9ecef',
            borderRadius: '20px',
            overflow: 'hidden',
            margin: '20px 0'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #4CAF50 0%, #8BC34A 40%, #FFC107 60%, #FF9800 80%, #F44336 100%)',
              borderRadius: '20px',
              transition: 'width 0.1s ease-out',
              width: `${meterWidth}%`
            }} />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '5px',
            fontSize: '11px',
            color: '#999'
          }}>
            <span>30</span>
            <span>40</span>
            <span>50</span>
            <span>60</span>
            <span>70</span>
            <span>80</span>
            <span>90</span>
            <span>100</span>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '20px',
            padding: '15px',
            background: '#fff',
            borderRadius: '12px',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>{t('dbmeter.peak')}</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>{peakDb || '--'}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>{t('dbmeter.average')}</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>{avgDb || '--'}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>{t('dbmeter.min')}</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>{minDb || '--'}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <button 
            onClick={handleToggle}
            style={{
              flex: 1,
              padding: '15px 24px',
              borderRadius: '12px',
              border: 'none',
              background: isRecording 
                ? 'linear-gradient(135deg, #f44336 0%, #e91e63 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'all 0.3s ease'
            }}
          >
            {isRecording ? t('dbmeter.stop_measuring') : t('dbmeter.start_measuring')}
          </button>
          
          <button 
            onClick={resetMeasurement}
            disabled={!isRecording && peakDb === 0}
            style={{
              padding: '15px 24px',
              borderRadius: '12px',
              border: '2px solid #e9ecef',
              background: '#f8f9fa',
              color: '#333',
              cursor: peakDb > 0 ? 'pointer' : 'not-allowed',
              opacity: peakDb > 0 ? 1 : 0.5,
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            {t('dbmeter.reset')}
          </button>
        </div>

        <div style={{
          background: '#f8f4ff',
          border: '1px solid #e4d4ff',
          borderRadius: '12px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h3 style={{
            color: '#764ba2',
            fontSize: '14px',
            margin: '0 0 10px 0'
          }}>
            📊 {t('dbmeter.session_log')}
          </h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button 
              onClick={handleSaveMeasurement}
              disabled={peakDb === 0}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '2px solid #e9ecef',
                background: peakDb > 0 ? '#e8f5e8' : '#f5f5f5',
                color: peakDb > 0 ? '#2e7d32' : '#999',
                cursor: peakDb > 0 ? 'pointer' : 'not-allowed',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              {t('dbmeter.save_current_reading')}
            </button>
            <button 
              onClick={clearLog}
              disabled={sessionLog.length === 0}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '2px solid #fcc',
                background: sessionLog.length > 0 ? '#fee' : '#f5f5f5',
                color: sessionLog.length > 0 ? '#c00' : '#999',
                cursor: sessionLog.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              {t('dbmeter.clear_log')}
            </button>
          </div>
          <div style={{ 
            maxHeight: '150px', 
            overflowY: 'auto',
            fontSize: '12px'
          }}>
            {sessionLog.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center', margin: '10px 0' }}>
                {t('dbmeter.no_readings_saved')}
              </p>
            ) : (
              sessionLog.slice(-5).reverse().map((entry, index) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px',
                    borderBottom: '1px solid #e9ecef'
                  }}
                >
                  <span style={{ color: '#666' }}>
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                  <span>
                    Peak: <strong>{entry.peak}</strong> | 
                    Avg: <strong>{entry.average}</strong> | 
                    Min: <strong>{entry.minimum}</strong> dB
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{
          background: '#f0f7f0',
          border: '1px solid #c3e6c3',
          borderRadius: '12px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h3 style={{
            color: '#4CAF50',
            fontSize: '14px',
            margin: '0 0 10px 0'
          }}>
            {t('dbmeter.test_phrases_title')}
          </h3>
          <ul style={{
            fontSize: '13px',
            lineHeight: '1.8',
            color: '#555',
            margin: '0',
            paddingLeft: '20px'
          }}>
            <li><strong>{t('dbmeter.sustained_vowel')}</strong> {t('dbmeter.sustained_vowel_example')}</li>
            <li><strong>{t('dbmeter.standard_phrase')}</strong> {t('dbmeter.standard_phrase_example')}</li>
            <li><strong>{t('dbmeter.loud_call')}</strong> {t('dbmeter.loud_call_example')}</li>
            <li><strong>{t('dbmeter.dynamic_test')}</strong> {t('dbmeter.dynamic_test_example')}</li>
          </ul>
        </div>

        <div style={{
          background: '#fff4e6',
          border: '1px solid #ffcc80',
          borderRadius: '12px',
          padding: '15px'
        }}>
          <h3 style={{
            color: '#e65100',
            fontSize: '14px',
            margin: '0 0 10px 0'
          }}>
            📈 {t('dbmeter.reference_values_title')}
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 2fr',
            gap: '8px 12px',
            fontSize: '12px'
          }}>
            <div style={{ fontWeight: 'bold', padding: '5px 0', borderBottom: '1px solid #ffcc80' }}>{t('dbmeter.voice_level')}</div>
            <div style={{ fontWeight: 'bold', padding: '5px 0', borderBottom: '1px solid #ffcc80', textAlign: 'center' }}>{t('dbmeter.expected_db')}</div>
            <div style={{ fontWeight: 'bold', padding: '5px 0', borderBottom: '1px solid #ffcc80' }}>{t('dbmeter.training_notes')}</div>
            
            <div style={{ padding: '3px 0' }}>{t('dbmeter.whisper')}</div>
            <div style={{ padding: '3px 0', textAlign: 'center' }}>30-40</div>
            <div style={{ padding: '3px 0', color: '#666' }}>{t('dbmeter.too_quiet_practice')}</div>
            
            <div style={{ padding: '3px 0', background: '#fff8e1', margin: '0 -6px', paddingLeft: '6px' }}>{t('dbmeter.quiet_conversation')}</div>
            <div style={{ padding: '3px 0', textAlign: 'center', background: '#fff8e1' }}>45-55</div>
            <div style={{ padding: '3px 0', color: '#666', background: '#fff8e1', margin: '0 -6px', paddingRight: '6px' }}>{t('dbmeter.use_for_sovt')}</div>
            
            <div style={{ padding: '3px 0', fontWeight: 'bold' }}>{t('dbmeter.normal_conversation')}</div>
            <div style={{ padding: '3px 0', textAlign: 'center', color: '#4CAF50', fontWeight: 'bold' }}>60-70</div>
            <div style={{ padding: '3px 0', color: '#666', fontWeight: 'bold' }}>{t('dbmeter.baseline_target')}</div>
            
            <div style={{ padding: '3px 0', background: '#fff8e1', margin: '0 -6px', paddingLeft: '6px' }}>{t('dbmeter.projected_voice')}</div>
            <div style={{ padding: '3px 0', textAlign: 'center', background: '#fff8e1' }}>70-80</div>
            <div style={{ padding: '3px 0', color: '#666', background: '#fff8e1', margin: '0 -6px', paddingRight: '6px' }}>{t('dbmeter.across_room_level')}</div>
            
            <div style={{ padding: '3px 0' }}>{t('dbmeter.loud_call')}</div>
            <div style={{ padding: '3px 0', textAlign: 'center' }}>80-90</div>
            <div style={{ padding: '3px 0', color: '#666' }}>{t('dbmeter.street_call_level')}</div>
            
            <div style={{ padding: '3px 0', color: '#d32f2f', fontWeight: 'bold' }}>{t('dbmeter.shouting')}</div>
            <div style={{ padding: '3px 0', textAlign: 'center', color: '#d32f2f' }}>90+</div>
            <div style={{ padding: '3px 0', color: '#d32f2f' }}>{t('dbmeter.risk_of_strain')}</div>
          </div>
          
          <div style={{
            marginTop: '15px',
            padding: '10px',
            background: '#e8f5e9',
            borderRadius: '8px'
          }}>
            <p style={{
              fontSize: '12px',
              color: '#2e7d32',
              margin: 0,
              lineHeight: '1.5'
            }}>
              <strong>💡 {t('dbmeter.healthy_practice')}</strong> {t('dbmeter.healthy_practice_text')}
            </p>
          </div>
        </div>

        <div style={{
          background: '#fff8e1',
          border: '1px solid #ffcc80',
          borderRadius: '8px',
          padding: '12px',
          marginTop: '20px',
          fontSize: '11px',
          color: '#e65100',
          lineHeight: '1.4'
        }}>
          <strong>⚠️ Measurement Disclaimer:</strong><br/>
          This tool provides <strong>approximate readings</strong> for voice training feedback. 
          Readings are calibrated relative to a quiet room baseline and are suitable for tracking <strong>progress over time</strong>.
          For absolute SPL measurements, use a calibrated sound level meter. 
          <br/><br/>
          <strong>Note:</strong> {t('dbmeter.calibration_note')}
        </div>
      </div>
    </div>
  )
}