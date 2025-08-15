import React, { useState, useEffect, useRef } from 'react'
import { useExerciseProgress } from '../hooks/useExerciseProgress.js'
import { useTranslation } from '../hooks/useTranslation'
import { useExerciseContent } from '../hooks/useExerciseContent'
import DbMeter from './DbMeter'
import TimerBreathing from './TimerBreathing'
import LanguageSelector from './LanguageSelector'

// ExerciseStep component for individual exercise rendering
// PropTypes: { step: object, isActive: boolean, onNext?: () => void, onPrev?: () => void, onComplete?: () => void, className?: string }
function ExerciseStep({ step, isActive, onNext, onPrev, onComplete, className = '' }) {
  const { t } = useTranslation()
  const exerciseContent = useExerciseContent(step.id)
  const [showDbMeter, setShowDbMeter] = useState(false)
  const [showBreathing, setShowBreathing] = useState(false)
  const [timerActive, setTimerActive] = useState(false)
  const [timerPaused, setTimerPaused] = useState(false)
  const [timeLeft, setTimeLeft] = useState(step.duration || 0)
  const timerRef = useRef(null)

  useEffect(() => {
    setShowDbMeter(step.requiresDbMeter || false)
    setShowBreathing(step.type === 'breathing')
    setTimeLeft(step.duration || 0)
    setTimerActive(false)
    setTimerPaused(false)
  }, [step])

  useEffect(() => {
    if (timerActive && !timerPaused && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1
          
          // Play completion sound when timer ends
          if (newTime === 0) {
            // Completion sound - three ascending tones
            playSound(523, 0.2) // C5
            setTimeout(() => playSound(659, 0.2), 200) // E5
            setTimeout(() => playSound(784, 0.4), 400) // G5
            setTimerActive(false)
          }
          
          return newTime
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [timerActive, timerPaused, timeLeft])

  const startTimer = () => {
    if (timeLeft > 0) {
      // Play start sound - gentle ascending tone
      playSound(440, 0.3) // A4
      setTimerActive(true)
      setTimerPaused(false)
    }
  }

  const pauseTimer = () => {
    setTimerPaused(!timerPaused)
  }

  const resetTimer = () => {
    setTimerActive(false)
    setTimerPaused(false)
    setTimeLeft(step.duration || 0)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const playSound = (frequency, duration, type = 'sine') => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
      oscillator.type = type
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration)
    } catch {
      console.log('Audio not supported or blocked')
    }
  }

  const getTypeColor = (type) => {
    const colors = {
      physical: '#8BC34A',
      breathing: '#2196F3', 
      resonance: '#FF9800',
      articulation: '#9C27B0',
      power: '#F44336',
      flexibility: '#00BCD4',
      warmup: '#4CAF50',
      cooldown: '#607D8B'
    }
    return colors[type] || '#666'
  }

  return (
    <div className={`exercise-step ${className}`} style={{
      background: 'white',
      borderRadius: 'clamp(12px, 2vw, 16px)',
      padding: 'clamp(20px, 4vw, 30px)',
      margin: 'clamp(15px, 3vw, 20px) 0',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      border: isActive ? `3px solid ${getTypeColor(step.type)}` : '1px solid #e0e0e0'
    }}>
      {/* Navigation Buttons - Top */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 'clamp(20px, 4vw, 25px)',
        paddingBottom: 'clamp(15px, 3vw, 20px)',
        borderBottom: '1px solid #eee',
        gap: '10px'
      }}>
        {onPrev ? (
          <button
            onClick={onPrev}
            style={{
              padding: 'clamp(8px, 2vw, 10px) clamp(15px, 3vw, 20px)',
              background: 'transparent',
              border: '2px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: 'clamp(12px, 2.5vw, 14px)',
              color: '#666',
              whiteSpace: 'nowrap'
            }}
          >
            {t('navigation.previous')}
          </button>
        ) : <div />}
        
        {onNext && (
          <button
            onClick={onNext}
            style={{
              padding: 'clamp(8px, 2vw, 10px) clamp(15px, 3vw, 20px)',
              background: getTypeColor(step.type),
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: 'clamp(12px, 2.5vw, 14px)',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}
          >
            {t('navigation.next')}
          </button>
        )}
        
        {onComplete && (
          <button
            onClick={onComplete}
            style={{
              padding: 'clamp(8px, 2vw, 10px) clamp(15px, 3vw, 20px)',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: 'clamp(12px, 2.5vw, 14px)',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)'
            }}
          >
            {t('navigation.complete_session')}
          </button>
        )}
      </div>

      {/* Exercise Header */}
      <div style={{ marginBottom: '25px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          background: getTypeColor(step.type),
          color: 'white',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 'bold',
          marginBottom: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {t(`types.${step.type}`)}
        </div>
        <h3 style={{ 
          fontSize: 'clamp(20px, 4vw, 24px)', 
          color: '#333', 
          margin: '0 0 10px 0',
          fontWeight: '400'
        }}>
          {exerciseContent.name}
        </h3>
        {step.duration && (
          <div style={{ 
            fontSize: '14px', 
            color: '#666',
            margin: '5px 0'
          }}>
            {t('timer.duration')}: {Math.floor(step.duration / 60)}:{(step.duration % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          fontSize: '16px', 
          lineHeight: '1.6', 
          color: '#444',
          margin: '0 0 15px 0'
        }}>
          {exerciseContent.instructions.split('\n\n').map((paragraph, index) => (
            <p key={index} style={{ margin: index === 0 ? '0 0 10px 0' : '10px 0' }}>
              {paragraph.split('\n').map((line, lineIndex) => (
                <span key={lineIndex}>
                  {line}
                  {lineIndex < paragraph.split('\n').length - 1 && <br />}
                </span>
              ))}
            </p>
          ))}
        </div>
        
        {exerciseContent.dos && Array.isArray(exerciseContent.dos) && exerciseContent.dos.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ fontSize: '14px', color: '#4CAF50', margin: '0 0 8px 0' }}>{t('exercise.do')}</h4>
            <ul style={{ margin: '0', paddingLeft: '20px', color: '#666' }}>
              {exerciseContent.dos.map((item, index) => (
                <li key={index} style={{ marginBottom: '4px', fontSize: '14px' }}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        
        {exerciseContent.donts && Array.isArray(exerciseContent.donts) && exerciseContent.donts.length > 0 && (
          <div>
            <h4 style={{ fontSize: '14px', color: '#f44336', margin: '0 0 8px 0' }}>{t('exercise.dont')}</h4>
            <ul style={{ margin: '0', paddingLeft: '20px', color: '#666' }}>
              {exerciseContent.donts.map((item, index) => (
                <li key={index} style={{ marginBottom: '4px', fontSize: '14px' }}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Exercise Timer - Only for non-breathing exercises with duration */}
      {step.duration && !showBreathing && (
        <div style={{
          background: '#f8f9fa',
          borderRadius: '12px',
          padding: 'clamp(15px, 3vw, 20px)',
          margin: '20px 0',
          textAlign: 'center',
          border: timerActive ? '2px solid #667eea' : '2px solid #e0e0e0'
        }}>
          <div style={{
            fontSize: 'clamp(24px, 5vw, 32px)',
            fontWeight: 'bold',
            color: timeLeft <= 10 && timerActive ? '#f44336' : '#333',
            marginBottom: '15px',
            fontFamily: 'monospace'
          }}>
            {formatTime(timeLeft)}
          </div>
          
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            {!timerActive ? (
              <button
                onClick={startTimer}
                disabled={timeLeft === 0}
                style={{
                  padding: '8px 16px',
                  background: timeLeft === 0 ? '#ccc' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: timeLeft === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {t('timer.start')}
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                style={{
                  padding: '8px 16px',
                  background: timerPaused ? '#28a745' : '#ffc107',
                  color: timerPaused ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {timerPaused ? t('timer.resume') : t('timer.pause')}
              </button>
            )}
            
            <button
              onClick={resetTimer}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: '#666',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {t('timer.reset')}
            </button>
          </div>
          
          {timeLeft === 0 && (
            <div style={{
              marginTop: '10px',
              color: '#28a745',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              {t('timer.exercise_complete')}
            </div>
          )}
        </div>
      )}

      {/* Embedded Components */}
      {showDbMeter && (
        <div style={{ margin: '20px 0' }}>
          <DbMeter compact={true} />
        </div>
      )}
      
      {showBreathing && (
        <div style={{ margin: '20px 0' }}>
          <TimerBreathing 
            compact={true}
            duration={step.duration} 
            pattern={step.breathingPattern || '4-4-4'}
            onComplete={() => {
              console.log('🎯 Breathing exercise completed!')
              if (onNext) {
                onNext()
              } else if (onComplete) {
                onComplete()
              }
            }}
          />
        </div>
      )}

    </div>
  )
}

// ExerciseOverviewItem component for session overview
function ExerciseOverviewItem({ exercise, index, currentStep, t }) {
  const exerciseContent = useExerciseContent(exercise.id)
  
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        background: index === currentStep ? '#f0f4ff' : '#f8f9fa',
        borderRadius: '6px',
        border: index === currentStep ? '2px solid #667eea' : '1px solid #e0e0e0'
      }}
    >
      <span style={{ 
        fontWeight: index === currentStep ? 'bold' : 'normal',
        color: index === currentStep ? '#667eea' : '#333'
      }}>
        {exerciseContent.name}
      </span>
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        fontSize: '12px', 
        color: '#666'
      }}>
        <span>{exercise.type}</span>
        <span>{Math.floor(exercise.duration / 60)}:{(exercise.duration % 60).toString().padStart(2, '0')}</span>
      </div>
      {index < currentStep && (
        <div style={{ fontSize: '12px', color: '#4CAF50', marginTop: '5px' }}>
          {t('overview.completed')}
        </div>
      )}
      {index === currentStep && (
        <div style={{ fontSize: '12px', color: '#667eea', marginTop: '5px' }}>
          {t('overview.current')}
        </div>
      )}
    </div>
  )
}

// Main Wizard component
// PropTypes: { className?: string; onExerciseComplete?: (data) => void; navigateTo?: (route) => void }
export default function Wizard({ className = '', onExerciseComplete, navigateTo, routineId }) {
  const selectedRoutine = routineId || 'morning'
  const { t } = useTranslation()

  const {
    currentStep,
    currentExercise,
    currentRoutine,
    timeElapsed,
    stepTimeLeft,
    nextStep,
    previousStep,
    reset,
    formatTime,
    getProgress
  } = useExerciseProgress(selectedRoutine, 10, onExerciseComplete)

  // Routine execution view
  const progress = getProgress()

  return (
    <div className={`wizard-routine ${className}`} style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: 'clamp(10px, 3vw, 20px)',
      width: '100%',
      position: 'relative'
    }}>
      <LanguageSelector position="fixed" />
      {/* Header with Progress */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 'clamp(12px, 2vw, 16px)',
        padding: 'clamp(15px, 4vw, 25px)',
        color: 'white',
        marginBottom: 'clamp(20px, 4vw, 30px)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          marginBottom: 'clamp(15px, 3vw, 20px)',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ 
              margin: '0 0 5px 0', 
              fontSize: 'clamp(18px, 4vw, 24px)', 
              fontWeight: '300' 
            }}>
              {t(`routine_names.${currentRoutine.id}`)}
            </h2>
            <p style={{ 
              margin: '0', 
              opacity: '0.9', 
              fontSize: 'clamp(12px, 2.5vw, 14px)' 
            }}>
              {t(`routine_descriptions.${currentRoutine.id}`)}
            </p>
          </div>
          <div style={{ 
            textAlign: 'left',
            minWidth: 'fit-content'
          }}>
            <div style={{ 
              fontSize: 'clamp(16px, 3.5vw, 20px)', 
              fontWeight: 'bold' 
            }}>
              {formatTime(timeElapsed)}
            </div>
            <div style={{ 
              fontSize: 'clamp(10px, 2vw, 12px)', 
              opacity: '0.8' 
            }}>
              {t('timer.total_time')}
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '12px',
            marginBottom: '8px',
            opacity: '0.9'
          }}>
            <span>{t('timer.step_of', { current: currentStep + 1, total: currentRoutine.exercises.length })}</span>
            <span>{t('timer.percent_complete', { percent: Math.round(progress.percentage) })}</span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            background: 'rgba(255,255,255,0.3)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress.percentage}%`,
              height: '100%',
              background: 'rgba(255,255,255,0.9)',
              borderRadius: '4px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Session Controls */}
        <div style={{ 
          display: 'flex', 
          gap: 'clamp(8px, 2vw, 10px)', 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => navigateTo && navigateTo('welcome')}
            style={{
              padding: 'clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 16px)',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: 'clamp(10px, 2.2vw, 12px)',
              whiteSpace: 'nowrap'
            }}
          >
            {t('navigation.back_to_home')}
          </button>
          
          
          <button
            onClick={reset}
            style={{
              padding: 'clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 16px)',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: 'clamp(10px, 2.2vw, 12px)',
              whiteSpace: 'nowrap'
            }}
          >
            {t('timer.reset')}
          </button>
        </div>
      </div>

      {/* Current Exercise */}
      <ExerciseStep
        step={currentExercise}
        isActive={true}
        onNext={currentStep < currentRoutine.exercises.length - 1 ? nextStep : null}
        onPrev={currentStep > 0 ? previousStep : null}
        onComplete={currentStep >= currentRoutine.exercises.length - 1 ? () => navigateTo('welcome') : null}
      />


      {/* Exercise Overview */}
      <div style={{
        background: 'white',
        borderRadius: 'clamp(8px, 2vw, 12px)',
        padding: 'clamp(15px, 3vw, 20px)',
        marginTop: 'clamp(20px, 4vw, 30px)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ 
          margin: '0 0 clamp(15px, 3vw, 20px) 0', 
          fontSize: 'clamp(16px, 3vw, 18px)', 
          color: '#333' 
        }}>
          {t('overview.session_overview')}
        </h3>
        <div style={{ display: 'grid', gap: '8px' }}>
          {currentRoutine.exercises.map((exercise, index) => (
            <ExerciseOverviewItem 
              key={exercise.id}
              exercise={exercise}
              index={index}
              currentStep={currentStep}
              t={t}
            />
          ))}
        </div>
      </div>
    </div>
  )
}