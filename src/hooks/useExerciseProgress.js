import { useState, useCallback, useRef, useEffect } from 'react'

// Custom hook for exercise progress management (following synthesized contract)
export function useExerciseProgress(exerciseId, totalSteps, onComplete) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [stepTimeLeft, setStepTimeLeft] = useState(0)
  // Session data managed through localStorage
  
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const pauseTimeRef = useRef(0)
  const stepStartRef = useRef(null)

  // Complete exercise routine data (structural data only - content comes from translations)
  const routines = {
    morning: {
      id: 'morning',
      name: 'Morning Routine',
      duration: 14,
      description: 'Complete vocal warm-up and strengthening routine',
      exercises: [
        {
          id: 'laryngeal_reset',
          duration: 60,
          type: 'physical'
        },
        {
          id: 'breathing_hiss',
          duration: 180,
          type: 'breathing',
          breathingPattern: '4-4-6'
        },
        {
          id: 'straw_water',
          duration: 120,
          type: 'sovt'
        },
        {
          id: 'lip_trills',
          duration: 120,
          type: 'sovt'
        },
        {
          id: 'carryover',
          duration: 60,
          type: 'transition'
        },
        {
          id: 'hum_sirens',
          duration: 60,
          type: 'resonance'
        },
        {
          id: 'formant_tuning',
          duration: 180,
          type: 'resonance'
        },
        {
          id: 'yawn_sigh',
          duration: 60,
          type: 'release'
        }
      ]
    },
    evening: {
      id: 'evening',
      name: 'Evening Routine',
      duration: 14,
      description: 'Cool-down, reinforcement, and dynamic practice',
      exercises: [
        {
          id: 'sovt_cooldown',
          duration: 60,
          type: 'sovt'
        },
        {
          id: 'vocal_ladder',
          duration: 240,
          type: 'loudness'
        },
        {
          id: 'controlled_loud_read',
          duration: 180,
          type: 'endurance',
          optional: true,
          schedule: 'WedFri'
        }
      ]
    },
    weekend: {
      id: 'weekend',
      name: 'Weekend Silence-Proof Routine',
      duration: 11,
      description: 'Keep the voice active to prevent Monday morning stiffness',
      exercises: [
        {
          id: 'reading_aloud',
          duration: 180,
          type: 'maintenance'
        },
        {
          id: 'cold_start_protocol',
          duration: 120,
          type: 'activation'
        },
        {
          id: 'singing_humming',
          duration: 360,
          type: 'enjoyment'
        }
      ]
    },
    optional: {
      id: 'optional',
      name: 'Optional Modules',
      duration: 10,
      description: 'Advanced training for targeted voice issues',
      exercises: [
        {
          id: 'soft_palate_work',
          duration: 120,
          type: 'strengthening'
        },
        {
          id: 'nasal_oral_contrast',
          duration: 120,
          type: 'sensory_training'
        },
        {
          id: 'bite_block_reading',
          duration: 120,
          type: 'advanced_technique',
          warning: true
        },
        {
          id: 'rmst_training',
          duration: 180,
          type: 'strength_training'
        }
      ]
    }
  }

  const currentRoutine = routines[exerciseId] || routines.morning
  const currentExercise = currentRoutine.exercises[currentStep] || currentRoutine.exercises[0]

  const nextStep = useCallback(() => {
    const isLastStep = currentStep >= currentRoutine.exercises.length - 1
    
    if (isLastStep) {
      // Session complete
      const completionData = {
        routineId: exerciseId,
        duration: timeElapsed,
        completedAt: new Date().toISOString(),
        steps: currentRoutine.exercises.length
      }
      
      // Save to localStorage
      const existingProgress = JSON.parse(localStorage.getItem('voiceCoachProgress') || '[]')
      existingProgress.push(completionData)
      localStorage.setItem('voiceCoachProgress', JSON.stringify(existingProgress))
      
      setIsActive(false)
      if (onComplete) {
        onComplete(completionData)
      }
    } else {
      setCurrentStep(prev => prev + 1)
      stepStartRef.current = Date.now()
      if (currentRoutine.exercises[currentStep + 1]?.duration) {
        setStepTimeLeft(currentRoutine.exercises[currentStep + 1].duration)
      }
    }
  }, [currentStep, currentRoutine, exerciseId, timeElapsed, onComplete])

  const updateTimer = useCallback(() => {
    if (!isActive || isPaused) return

    const now = Date.now()
    const totalElapsed = (now - startTimeRef.current - pauseTimeRef.current) / 1000
    setTimeElapsed(Math.floor(totalElapsed))

    if (currentExercise.duration) {
      const stepElapsed = (now - stepStartRef.current) / 1000
      const remaining = Math.max(0, currentExercise.duration - stepElapsed)
      setStepTimeLeft(Math.ceil(remaining))

      if (remaining <= 0) {
        // Auto-advance to next step
        nextStep()
        return
      }
    }

    timerRef.current = setTimeout(updateTimer, 1000)
  }, [isActive, isPaused, currentExercise, nextStep])

  const start = useCallback(() => {
    const now = Date.now()
    
    if (!isActive) {
      startTimeRef.current = now
      stepStartRef.current = now
      pauseTimeRef.current = 0
      setStepTimeLeft(currentExercise.duration || 0)
    } else if (isPaused) {
      pauseTimeRef.current += now - pauseTimeRef.current
      stepStartRef.current = now - (currentExercise.duration - stepTimeLeft) * 1000
    }
    
    setIsActive(true)
    setIsPaused(false)
    updateTimer()
  }, [isActive, isPaused, currentExercise, stepTimeLeft, updateTimer])

  const pause = useCallback(() => {
    if (isActive && !isPaused) {
      setIsPaused(true)
      pauseTimeRef.current = Date.now()
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isActive, isPaused])

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      stepStartRef.current = Date.now()
      const prevExercise = currentRoutine.exercises[currentStep - 1]
      setStepTimeLeft(prevExercise.duration || 0)
    }
  }, [currentStep, currentRoutine])

  const reset = useCallback(() => {
    setIsActive(false)
    setIsPaused(false)
    setCurrentStep(0)
    setTimeElapsed(0)
    setStepTimeLeft(currentRoutine.exercises[0]?.duration || 0)
    
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }, [currentRoutine])

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  const getTotalRoutineDuration = useCallback(() => {
    return currentRoutine.exercises.reduce((total, exercise) => total + (exercise.duration || 0), 0)
  }, [currentRoutine])

  const getProgress = useCallback(() => {
    return {
      current: currentStep + 1,
      total: currentRoutine.exercises.length,
      percentage: ((currentStep + 1) / currentRoutine.exercises.length) * 100
    }
  }, [currentStep, currentRoutine])

  return {
    // State
    currentStep,
    currentExercise,
    currentRoutine,
    isActive,
    isPaused,
    timeElapsed,
    stepTimeLeft,
    
    // Controls
    start,
    pause,
    nextStep,
    previousStep,
    reset,
    
    // Helpers
    formatTime,
    getProgress,
    getTotalRoutineDuration,
    
    // Available routines
    routines
  }
}