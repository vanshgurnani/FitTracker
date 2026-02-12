/* Frontend proxy to backend Gemini endpoints */

export interface FoodAnalysisResult {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  confidence: number
  breakdown: string[]
}

export const analyzeFoodDescription = async (
  description: string
): Promise<FoodAnalysisResult> => {
  try {
    const res = await fetch('/api/gemini/food-analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
      credentials: 'include',
    })

    if (!res.ok) throw new Error(`Server responded ${res.status}`)
    const payload = await res.json()
    return payload.data as FoodAnalysisResult
  } catch (error) {
    console.error('Gemini food analysis (frontend) error:', error)
    return {
      calories: 300,
      protein: 15,
      carbs: 30,
      fat: 10,
      confidence: 50,
      breakdown: ['Unable to analyze precisely — using estimated average values'] as string[],
    }
  }
}

export interface ExerciseAnalysisResult {
  caloriesBurned: number
  exerciseType: 'cardio' | 'strength' | 'flexibility' | 'sports' | 'other'
  intensity: 'light' | 'moderate' | 'vigorous' | 'high'
  confidence: number
  breakdown: string[]
  recommendations?: string[]
}

export const analyzeExerciseDescription = async (
  description: string,
  duration?: number,
  userWeight?: number
): Promise<ExerciseAnalysisResult> => {
  try {
    const res = await fetch('/api/gemini/exercise-analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, duration, userWeight }),
      credentials: 'include',
    })

    if (!res.ok) throw new Error(`Server responded ${res.status}`)
    const payload = await res.json()
    return payload.data as ExerciseAnalysisResult
  } catch (error) {
    console.error('Gemini exercise analysis (frontend) error:', error)
    return {
      caloriesBurned: duration ? Math.round((duration as number) * 5) : 200,
      exerciseType: 'other',
      intensity: 'moderate',
      confidence: 50,
      breakdown: ['Unable to analyze — using estimated average values'] as string[],
    }
  }
}

export const getFitnessAdvice = async (
  question: string,
  userContext?: {
    age?: number
    weight?: number
    height?: number
    fitnessGoal?: string
    activityLevel?: string
  }
): Promise<string> => {
  try {
    const res = await fetch('/api/gemini/advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, userContext }),
      credentials: 'include',
    })

    if (!res.ok) throw new Error(`Server responded ${res.status}`)
    const payload = await res.json()
    return payload.data as string
  } catch (error) {
    console.error('Fitness advice (frontend) error:', error)
    return "I'm sorry, I couldn't provide advice at this time. Please consult with a healthcare professional for personalized fitness guidance."
  }
}
