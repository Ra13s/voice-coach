import { useTranslation } from './useTranslation';

/**
 * Hook to get translated exercise content
 * @param {string} exerciseId - The exercise ID to get content for
 * @returns {object} Object containing translated name, instructions, dos, and donts
 */
export const useExerciseContent = (exerciseId) => {
  const { t, loading } = useTranslation();
  
  // Return safe defaults while loading or if exercise doesn't exist
  if (loading || !exerciseId) {
    return {
      name: exerciseId || 'Loading...',
      instructions: 'Loading instructions...',
      dos: [],
      donts: []
    };
  }
  
  const name = t(`exercises.${exerciseId}.name`);
  const instructions = t(`exercises.${exerciseId}.instructions`);
  const dos = t(`exercises.${exerciseId}.dos`);
  const donts = t(`exercises.${exerciseId}.donts`);
  
  // Debug logging to see what we're getting
  if (process.env.NODE_ENV === 'development') {
    console.log(`Exercise ${exerciseId}:`, {
      name, instructions, 
      dos: { type: typeof dos, isArray: Array.isArray(dos), value: dos },
      donts: { type: typeof donts, isArray: Array.isArray(donts), value: donts }
    });
  }
  
  return {
    name: name && name !== `exercises.${exerciseId}.name` ? name : exerciseId,
    instructions: instructions && instructions !== `exercises.${exerciseId}.instructions` ? instructions : 'Instructions loading...',
    dos: Array.isArray(dos) ? dos : [],
    donts: Array.isArray(donts) ? donts : []
  };
};

export default useExerciseContent;