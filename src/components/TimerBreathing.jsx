import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from '../hooks/useTranslation'
import LanguageSelector from './LanguageSelector'

// High-precision breathing timer with smooth animations
export default function TimerBreathing({ 
  className = '', 
  compact = false, 
  duration = 300, 
  pattern = '4-4-6',
  onComplete
}) {
  const { t } = useTranslation()
  
  // Parse pattern string to object
  const parsePattern = (patternStr) => {
    const [inhale, hold, exhale] = patternStr.split('-').map(n => parseInt(n, 10))
    return { inhale, hold, exhale }
  }

  // State
  const [isActive, setIsActive] = useState(false)
  const [phase, setPhase] = useState('inhale')
  const [timeLeft, setTimeLeft] = useState(4)
  const [cycle, setCycle] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [currentPattern, setCurrentPattern] = useState(parsePattern(pattern))
  const [soundType, setSoundType] = useState('chimes')
  const [showSettings, setShowSettings] = useState(false)

  // Refs for high-precision timing
  const audioContextRef = useRef(null)
  const rafIdRef = useRef(null)
  const sessionStartRef = useRef(null)
  const pausedAccumRef = useRef(0)
  const pauseStartRef = useRef(null)
  const phaseStartRef = useRef(null)
  const phaseEndRef = useRef(null)
  const remainingMsRef = useRef(null)
  
  // Refs for animation loop (to avoid stale closures)
  const isActiveRef = useRef(false)
  const phaseRef = useRef('inhale')
  
  // Refs for SVG elements
  const ringProgressRef = useRef(null)
  const segInhaleRef = useRef(null)
  const segHoldRef = useRef(null)
  const segExhaleRef = useRef(null)

  // Phase definitions
  const phases = useCallback(() => ({
    inhale: {
      duration: currentPattern.inhale,
      next: 'hold',
      label: t('breathing.inhale'),
      color: ['from-blue-400', 'to-blue-600'],
      instruction: t('breathing.inhale_instruction'),
      startAngle: 0
    },
    hold: {
      duration: currentPattern.hold,
      next: 'exhale',
      label: t('breathing.hold'),
      color: ['from-yellow-400', 'to-yellow-600'],
      instruction: t('breathing.hold_instruction'),
      startAngle: currentPattern.inhale
    },
    exhale: {
      duration: currentPattern.exhale,
      next: 'inhale',
      label: t('breathing.exhale'),
      color: ['from-green-400', 'to-green-600'],
      instruction: t('breathing.exhale_instruction'),
      startAngle: currentPattern.inhale + currentPattern.hold
    }
  }), [currentPattern, t])

  const circumference = 2 * Math.PI * 90 // r=90

  // Audio context management
  const ensureAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      audioContextRef.current = new AudioContext()
    }
    return audioContextRef.current
  }, [])

  // Sound generation
  const playSound = useCallback((phaseType) => {
    try {
      const ctx = ensureAudioContext()
      
      if (soundType === 'beeps') {
        const freqs = { inhale: 660, hold: 523, exhale: 440 }
        ;[0, 0.1].forEach((delay) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.frequency.setValueAtTime(freqs[phaseType], ctx.currentTime + delay)
          osc.type = 'sine'
          gain.gain.setValueAtTime(0.35, ctx.currentTime + delay)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.5)
          osc.start(ctx.currentTime + delay)
          osc.stop(ctx.currentTime + delay + 0.5)
        })
      } else if (soundType === 'chimes') {
        const freqs = {
          inhale: [523, 659, 784],
          hold: [440, 554, 659],
          exhale: [349, 440, 523]
        }
        freqs[phaseType].forEach((f, i) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.15)
          osc.type = 'sine'
          gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.15)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 1.0)
          osc.start(ctx.currentTime + i * 0.15)
          osc.stop(ctx.currentTime + i * 0.15 + 1.0)
        })
      } else if (soundType === 'bowls') {
        const base = { inhale: 523, hold: 440, exhale: 349 }
        ;[1, 1.5, 2].forEach((h) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.frequency.setValueAtTime(base[phaseType] * h, ctx.currentTime)
          osc.type = 'sine'
          const vol = 0.3 / (h * 1.2)
          gain.gain.setValueAtTime(vol, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 2.0)
        })
      }
    } catch (error) {
      console.warn('Audio playback failed:', error)
    }
  }, [soundType, ensureAudioContext])

  // Update visual progress ring
  const updateProgress = useCallback((nowMs) => {
    const ph = phases()[phaseRef.current]
    const total = currentPattern.inhale + currentPattern.hold + currentPattern.exhale
    const elapsedInPhase = Math.max(0, Math.min(ph.duration, (nowMs - phaseStartRef.current) / 1000))
    const currentPhaseProgress = ph.duration ? (elapsedInPhase / ph.duration) : 0
    const phaseStartProgress = ph.startAngle / total
    const phaseLength = ph.duration / total
    const overall = phaseStartProgress + (currentPhaseProgress * phaseLength)
    const offset = circumference - (overall * circumference)
    
    // Debug logging (reduced frequency)
    if (Math.random() < 0.002) {
      console.log('📊 Progress:', {
        phase: phaseRef.current,
        progress: (currentPhaseProgress * 100).toFixed(0) + '%',
        offset: offset.toFixed(0)
      })
    }
    
    if (ringProgressRef.current) {
      ringProgressRef.current.setAttribute('stroke-dashoffset', offset)
    } else {
      console.warn('⚠️ ringProgressRef.current is null!')
    }
  }, [phases, currentPattern, circumference])

  // Update segments display
  const updateSegments = useCallback(() => {
    const total = currentPattern.inhale + currentPattern.hold + currentPattern.exhale
    const segIn = (currentPattern.inhale / total) * circumference
    const segHold = (currentPattern.hold / total) * circumference
    const segEx = (currentPattern.exhale / total) * circumference
    
    console.log('🎨 updateSegments called:', {
      pattern: currentPattern,
      total,
      segmentLengths: { segIn, segHold, segEx },
      refsExist: {
        segInhale: !!segInhaleRef.current,
        segHold: !!segHoldRef.current,
        segExhale: !!segExhaleRef.current
      }
    })
    
    if (segInhaleRef.current) {
      segInhaleRef.current.setAttribute('stroke-dasharray', `${segIn} ${circumference}`)
      segInhaleRef.current.setAttribute('stroke-dashoffset', '0')
    } else {
      console.warn('⚠️ segInhaleRef.current is null!')
    }
    
    if (segHoldRef.current) {
      segHoldRef.current.setAttribute('stroke-dasharray', `${segHold} ${circumference}`)
      segHoldRef.current.setAttribute('stroke-dashoffset', `-${segIn}`)
    } else {
      console.warn('⚠️ segHoldRef.current is null!')
    }
    
    if (segExhaleRef.current) {
      segExhaleRef.current.setAttribute('stroke-dasharray', `${segEx} ${circumference}`)
      segExhaleRef.current.setAttribute('stroke-dashoffset', `-${segIn + segHold}`)
    } else {
      console.warn('⚠️ segExhaleRef.current is null!')
    }
  }, [currentPattern, circumference])

  // Format time display
  const formatTime = useCallback((seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }, [])

  // Main animation loop
  const loop = useCallback((nowMs) => {
    if (!isActiveRef.current) {
      console.log('❌ Loop called but isActiveRef is false')
      return
    }

    // Debug logging (reduced frequency)
    if (Math.random() < 0.005) {
      console.log('🔄 Loop:', {
        phase: phaseRef.current,
        timeLeft: Math.ceil((phaseEndRef.current - nowMs) / 1000),
        elapsed: Math.floor((nowMs - sessionStartRef.current - pausedAccumRef.current) / 1000)
      })
    }

    // Check for phase transitions
    let transitioned = false
    let newPhase = phaseRef.current
    while (nowMs >= phaseEndRef.current) {
      const currentPhase = phases()[phaseRef.current]
      const nextPhase = currentPhase.next
      console.log('🔄 Phase transition:', phaseRef.current, '->', nextPhase)
      phaseStartRef.current = phaseEndRef.current
      phaseRef.current = nextPhase
      newPhase = nextPhase
      setPhase(nextPhase) // Update React state for UI
      phaseEndRef.current = phaseStartRef.current + phases()[nextPhase].duration * 1000
      
      if (nextPhase === 'inhale') {
        setCycle(prev => prev + 1)
      }
      transitioned = true
    }

    if (transitioned) {
      playSound(newPhase)
    }

    // Update elapsed time
    const totalElapsed = Math.floor((nowMs - sessionStartRef.current - pausedAccumRef.current) / 1000)
    setElapsed(totalElapsed)

    // Check for session completion
    if (duration && totalElapsed >= duration) {
      console.log('⭐ Session completed! Duration:', duration, 'Elapsed:', totalElapsed)
      isActiveRef.current = false
      setIsActive(false)
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
      if (onComplete) {
        onComplete()
      }
      return
    }

    // Update time left in current phase
    const remainingSec = Math.max(0, Math.ceil((phaseEndRef.current - nowMs) / 1000))
    setTimeLeft(remainingSec)

    // Update progress ring
    updateProgress(nowMs)

    // Continue loop
    rafIdRef.current = requestAnimationFrame(loop)
  }, [phases, playSound, updateProgress, duration, onComplete])

  // Start/pause functionality
  const startPause = useCallback(() => {
    console.log('🔄 startPause called, isActiveRef:', isActiveRef.current)
    if (!isActiveRef.current) {
      const now = performance.now()
      
      if (!sessionStartRef.current) {
        // Fresh start - reset everything
        sessionStartRef.current = now
        pausedAccumRef.current = 0
        console.log('✨ Fresh start at:', now)
        
        // Initialize phase timing from scratch
        phaseStartRef.current = now
        phaseEndRef.current = now + phases()[phaseRef.current].duration * 1000
        console.log('⏰ Fresh phase timing:', { 
          phase: phaseRef.current, 
          duration: phases()[phaseRef.current].duration,
          start: phaseStartRef.current,
          end: phaseEndRef.current
        })
      } else if (pauseStartRef.current) {
        // Resume from pause
        pausedAccumRef.current += now - pauseStartRef.current
        pauseStartRef.current = null
        console.log('▶️ Resuming from pause')
        
        // Resume with remaining time
        if (remainingMsRef.current != null) {
          phaseStartRef.current = now
          phaseEndRef.current = now + remainingMsRef.current
          remainingMsRef.current = null
          console.log('⏰ Resumed phase timing with remaining:', remainingMsRef.current)
        }
      }

      console.log('🎵 Playing sound for phase:', phaseRef.current)
      console.log('🔗 SVG refs check:', {
        ringProgress: !!ringProgressRef.current,
        segInhale: !!segInhaleRef.current,
        segHold: !!segHoldRef.current,
        segExhale: !!segExhaleRef.current
      })

      // Update both React state and refs
      setIsActive(true)
      isActiveRef.current = true
      playSound(phaseRef.current)
      rafIdRef.current = requestAnimationFrame(loop)
      console.log('🚀 Animation loop started with RAF ID:', rafIdRef.current)
    } else {
      // Pause
      console.log('⏸️ Pausing timer')
      setIsActive(false)
      isActiveRef.current = false
      pauseStartRef.current = performance.now()
      remainingMsRef.current = Math.max(0, phaseEndRef.current - pauseStartRef.current)
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
      console.log('💾 Saved remaining time:', remainingMsRef.current)
    }
  }, [phases, playSound, loop])

  // Reset timer
  const reset = useCallback(() => {
    console.log('🔄 Reset called')
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
    }
    
    // Update both React state and refs
    setIsActive(false)
    isActiveRef.current = false
    setPhase('inhale')
    phaseRef.current = 'inhale'
    setCycle(0)
    setElapsed(0)
    sessionStartRef.current = null
    pausedAccumRef.current = 0
    pauseStartRef.current = null
    
    const now = performance.now()
    phaseStartRef.current = now
    phaseEndRef.current = now + phases().inhale.duration * 1000
    setTimeLeft(phases().inhale.duration)
    
    console.log('🔄 Reset: calling updateSegments()')
    updateSegments()
    
    console.log('🔄 Reset: setting ring progress offset to:', circumference)
    if (ringProgressRef.current) {
      ringProgressRef.current.setAttribute('stroke-dashoffset', circumference)
      console.log('✅ Reset: ring progress offset set successfully')
    } else {
      console.warn('⚠️ Reset: ringProgressRef.current is null!')
    }
  }, [phases, updateSegments, circumference])

  // Apply new pattern
  const applyPattern = useCallback((newPattern) => {
    const wasActive = isActive
    const now = performance.now()
    
    setCurrentPattern(newPattern)
    
    if (phaseStartRef.current != null) {
      const remainingMs = Math.max(0, phaseEndRef.current - now)
      phaseEndRef.current = now + remainingMs
    }
    
    if (!wasActive) {
      setPhase('inhale')
      phaseStartRef.current = now
      phaseEndRef.current = now + newPattern.inhale * 1000
      setTimeLeft(newPattern.inhale)
    }
  }, [isActive])

  // Preset patterns
  const presets = {
    '4-4-6': { inhale: 4, hold: 4, exhale: 6 },
    '4-7-8': { inhale: 4, hold: 7, exhale: 8 },
    '6-2-8': { inhale: 6, hold: 2, exhale: 8 }
  }

  // Initialize
  useEffect(() => {
    console.log('🚀 TimerBreathing initializing...', { duration, onComplete: !!onComplete })
    updateSegments()
    reset()
    console.log('✅ TimerBreathing initialized')
  }, [updateSegments, reset, duration, onComplete])

  // Session completion is now handled in the main loop for better timing

  // Get current phase data
  const currentPhase = phases()[phase]

  // Circle scaling animation
  const getCircleScale = () => {
    if (!isActive) return 1
    
    const now = performance.now()
    if (!phaseStartRef.current || !phaseEndRef.current) return 1
    
    const progress = Math.max(0, Math.min(1, (now - phaseStartRef.current) / (currentPhase.duration * 1000)))
    
    if (phase === 'inhale') return 1 + progress * 0.4
    if (phase === 'hold') return 1.4
    return 1.4 - progress * 0.4
  }

  if (compact) {
    return (
      <div className={`breathing-timer-compact ${className}`} style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '20px',
        maxWidth: '350px',
        margin: '0 auto',
        color: 'white',
        textAlign: 'center'
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          margin: '0 0 10px 0', 
          fontWeight: '300' 
        }}>
          {currentPattern.inhale}-{currentPattern.hold}-{currentPattern.exhale} {t('breathing.breathing')}
        </h3>
        
        {/* Session Timer */}
        {duration && (
          <div style={{
            fontSize: '14px',
            margin: '0 0 15px 0',
            opacity: 0.9,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{t('breathing.session')}: {formatTime(elapsed)}</span>
            <span>{formatTime(Math.max(0, duration - elapsed))} {t('breathing.left')}</span>
          </div>
        )}
        
        <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto 20px' }}>
          <svg 
            style={{ width: '200px', height: '200px', transform: 'rotate(-90deg)' }}
            viewBox="0 0 200 200"
          >
            <circle cx="100" cy="100" r="90" stroke="rgba(255,255,255,0.2)" strokeWidth="4" fill="none"/>
            <circle 
              ref={segInhaleRef}
              cx="100" cy="100" r="90" 
              stroke="rgba(59,130,246,0.3)" 
              strokeWidth="4" 
              fill="none" 
            />
            <circle 
              ref={segHoldRef}
              cx="100" cy="100" r="90" 
              stroke="rgba(251,191,36,0.3)" 
              strokeWidth="4" 
              fill="none" 
            />
            <circle 
              ref={segExhaleRef}
              cx="100" cy="100" r="90" 
              stroke="rgba(34,197,94,0.3)" 
              strokeWidth="4" 
              fill="none" 
            />
            <circle 
              ref={ringProgressRef}
              cx="100" cy="100" r="90" 
              stroke="white" 
              strokeWidth="4" 
              fill="none" 
              strokeLinecap="round" 
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
              style={{ transition: 'none' }}
            />
          </svg>
          
          <div 
            style={{
              position: 'absolute',
              inset: '20px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${currentPhase.color[0].replace('from-', '')}, ${currentPhase.color[1].replace('to-', '')})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${getCircleScale()})`,
              transition: 'transform 1s ease-in-out',
              opacity: 0.8,
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{currentPhase.label}</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '5px' }}>{timeLeft}</div>
            </div>
          </div>
        </div>

        <div style={{ 
          fontSize: '14px', 
          marginBottom: '15px', 
          minHeight: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {currentPhase.instruction}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={startPause}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {isActive ? t('breathing.pause') : t('breathing.start')}
          </button>
          <button
            onClick={reset}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {t('breathing.reset')}
          </button>
        </div>
      </div>
    )
  }

  // Full mode (standalone)
  return (
    <div 
      className={`breathing-timer ${className}`}
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        color: 'white',
        position: 'relative'
      }}>
        <LanguageSelector position="fixed" />
        
        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            padding: '8px',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          ⚙️
        </button>

        {/* Settings Panel */}
        {showSettings && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            padding: '24px',
            zIndex: 10,
            textAlign: 'left'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Settings</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '10px', opacity: 0.8 }}>Breathing Pattern</h4>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                {Object.entries(presets).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyPattern(preset)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '10px', opacity: 0.8 }}>Sound Style</h4>
              <select
                value={soundType}
                onChange={(e) => setSoundType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white'
                }}
              >
                <option value="beeps" style={{ background: '#333' }}>Clear Beeps</option>
                <option value="chimes" style={{ background: '#333' }}>Gentle Chimes</option>
                <option value="bowls" style={{ background: '#333' }}>Soft Singing Bowls</option>
              </select>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        )}

        {/* Header */}
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
          {currentPattern.inhale}-{currentPattern.hold}-{currentPattern.exhale} {t('breathing.breathing')}
        </h1>
        <p style={{ opacity: 0.7, marginBottom: '30px' }}>Complete Cycle Timer</p>

        {/* Stats */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '30px',
          display: 'flex',
          justifyContent: 'space-between',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ opacity: 0.6, fontSize: '14px' }}>Cycles</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{cycle}</div>
          </div>
          <div>
            <div style={{ opacity: 0.6, fontSize: '14px' }}>Session Time</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'monospace' }}>
              {formatTime(elapsed)}
            </div>
          </div>
          <div>
            <div style={{ opacity: 0.6, fontSize: '14px' }}>Current Phase</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>{currentPhase.label}</div>
          </div>
        </div>

        {/* Breathing Circle */}
        <div style={{ position: 'relative', width: '256px', height: '256px', margin: '0 auto 32px' }}>
          <svg 
            style={{ width: '256px', height: '256px', transform: 'rotate(-90deg)' }}
            viewBox="0 0 200 200"
          >
            <circle cx="100" cy="100" r="90" stroke="rgba(255,255,255,0.2)" strokeWidth="6" fill="none"/>
            <circle 
              ref={segInhaleRef}
              cx="100" cy="100" r="90" 
              stroke="rgba(59,130,246,0.3)" 
              strokeWidth="6" 
              fill="none" 
            />
            <circle 
              ref={segHoldRef}
              cx="100" cy="100" r="90" 
              stroke="rgba(251,191,36,0.3)" 
              strokeWidth="6" 
              fill="none" 
            />
            <circle 
              ref={segExhaleRef}
              cx="100" cy="100" r="90" 
              stroke="rgba(34,197,94,0.3)" 
              strokeWidth="6" 
              fill="none" 
            />
            <circle 
              ref={ringProgressRef}
              cx="100" cy="100" r="90" 
              stroke="white" 
              strokeWidth="6" 
              fill="none" 
              strokeLinecap="round" 
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
              style={{ transition: 'none' }}
            />
          </svg>
          
          <div 
            style={{
              position: 'absolute',
              inset: '32px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${currentPhase.color[0].replace('from-', '')}, ${currentPhase.color[1].replace('to-', '')})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${getCircleScale()})`,
              transition: 'transform 1s ease-in-out',
              opacity: 0.8,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{currentPhase.label}</div>
              <div style={{ fontSize: '48px', fontWeight: 'bold', marginTop: '8px' }}>{timeLeft}</div>
            </div>
          </div>
        </div>

        {/* Instruction */}
        <div style={{ 
          marginBottom: '32px', 
          minHeight: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <p style={{ fontSize: '18px', opacity: 0.9 }}>{currentPhase.instruction}</p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
          <button
            onClick={startPause}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.2s ease'
            }}
          >
            <span>{isActive ? '⏸' : '▶'}</span>
            <span>{isActive ? t('breathing.pause') : t('breathing.start')}</span>
          </button>
          
          <button
            onClick={reset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🔄</span>
            <span>{t('breathing.reset')}</span>
          </button>
        </div>

        {/* Sound Indicator */}
        <div style={{ opacity: 0.5, fontSize: '14px', marginBottom: '16px' }}>
          Sound: {soundType === 'chimes' ? 'Gentle Chimes' : soundType === 'beeps' ? 'Clear Beeps' : 'Soft Singing Bowls'}
        </div>

        {/* Presets */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {Object.entries(presets).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyPattern(preset)}
              style={{
                padding: '4px 12px',
                borderRadius: '16px',
                border: 'none',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s ease'
              }}
            >
              {key}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}