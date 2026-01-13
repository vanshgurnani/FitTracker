import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY
if (!apiKey) {
  throw new Error('Missing Gemini API key')
}

const genAI = new GoogleGenerativeAI(apiKey)

/* -------------------------------------------------------------------------- */
/*                                FOOD ANALYSIS                               */
/* -------------------------------------------------------------------------- */

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
    console.log('Analyzing food using Gemini...')

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `
You are a professional dietitian and nutrition data analyst.
Your task is to analyze the following food description and estimate its nutritional values.

Food description:
"${description}"

Instructions:
1. Assume reasonable serving sizes if not specified.
2. Use standard nutritional reference data (USDA/FDA-based).
3. Provide a realistic calorie and macronutrient breakdown.
4. Always respond ONLY with a valid JSON object (no text outside JSON).

The JSON must contain:
{
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "sugar": number,
  "sodium": number,
  "confidence": number,
  "breakdown": [
    "Item: details of calories and macros per item"
  ]
}

Example:
{
  "calories": 520,
  "protein": 36,
  "carbs": 40,
  "fat": 22,
  "fiber": 6,
  "sugar": 8,
  "sodium": 720,
  "confidence": 90,
  "breakdown": [
    "Grilled chicken breast (6oz): 280 cal, 35g protein",
    "Steamed broccoli (1 cup): 30 cal, 5g carbs, 3g protein",
    "Olive oil (1 tsp): 40 cal, 4.5g fat",
    "Brown rice (1/2 cup): 170 cal, 35g carbs, 3g protein"
  ]
}
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI JSON response')
    }

    const analysis = JSON.parse(jsonMatch[0]) as FoodAnalysisResult

    // Validate essential fields
    if (
      typeof analysis.calories !== 'number' ||
      typeof analysis.protein !== 'number' ||
      typeof analysis.carbs !== 'number' ||
      typeof analysis.fat !== 'number'
    ) {
      throw new Error('Incomplete nutrition data from AI')
    }

    console.log('Gemini food analysis successful.')
    return analysis
  } catch (error) {
    console.error('Gemini food analysis error:', error)
    return {
      calories: 300,
      protein: 15,
      carbs: 30,
      fat: 10,
      confidence: 50,
      breakdown: ['Unable to analyze precisely — using estimated average values']
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                              EXERCISE ANALYSIS                             */
/* -------------------------------------------------------------------------- */

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
    console.log('Analyzing exercise using Gemini...')

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `
You are a professional fitness trainer and exercise physiologist.
Analyze the following exercise description and estimate energy expenditure.

Exercise description:
"${description}"
${duration ? `Duration: ${duration} minutes` : ''}
${userWeight ? `User weight: ${userWeight} lbs` : 'Assume average weight: 150 lbs'}

Instructions:
- Base your calculation on standard MET values.
- Respond ONLY with a valid JSON object.
- Include calorie estimation, exercise type, and confidence.

JSON format:
{
  "caloriesBurned": number,
  "exerciseType": "cardio" | "strength" | "flexibility" | "sports" | "other",
  "intensity": "light" | "moderate" | "vigorous" | "high",
  "confidence": number,
  "breakdown": [
    "Explain how calories were calculated"
  ],
  "recommendations": [
    "Optional advice for improvement"
  ]
}

Example:
{
  "caloriesBurned": 320,
  "exerciseType": "cardio",
  "intensity": "moderate",
  "confidence": 90,
  "breakdown": [
    "Running at moderate pace (8 METs)",
    "30 mins × 8 METs × 150 lbs ≈ 320 cal"
  ],
  "recommendations": [
    "Great cardio workout! Try increasing pace gradually",
    "Consider adding strength training twice a week"
  ]
}
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Failed to parse AI response')

    const analysis = JSON.parse(jsonMatch[0]) as ExerciseAnalysisResult

    if (
      typeof analysis.caloriesBurned !== 'number' ||
      !['cardio', 'strength', 'flexibility', 'sports', 'other'].includes(
        analysis.exerciseType
      ) ||
      !['light', 'moderate', 'vigorous', 'high'].includes(analysis.intensity)
    ) {
      throw new Error('Invalid exercise data from AI')
    }

    console.log('Gemini exercise analysis successful.')
    return analysis
  } catch (error) {
    console.error('Exercise analysis error:', error)
    return {
      caloriesBurned: duration ? Math.round(duration * 5) : 200,
      exerciseType: 'other',
      intensity: 'moderate',
      confidence: 50,
      breakdown: ['Unable to analyze — using estimated average values']
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                              GENERAL FITNESS CHAT                          */
/* -------------------------------------------------------------------------- */

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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const contextStr = userContext
      ? `
User Context:
- Age: ${userContext.age || 'Not specified'}
- Weight: ${userContext.weight || 'Not specified'} lbs
- Height: ${userContext.height || 'Not specified'} inches
- Fitness Goal: ${userContext.fitnessGoal || 'Not specified'}
- Activity Level: ${userContext.activityLevel || 'Not specified'}
`
      : ''

    const prompt = `
You are a certified fitness and nutrition coach.
Answer the following question with clear, evidence-based, and motivational advice.

${contextStr}

Question: "${question}"

Please provide:
1. A clear and practical answer
2. Actionable steps or recommendations
3. Important safety considerations
4. Encouragement or motivational note

Keep the response concise (2–3 short paragraphs max).
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Fitness advice error:', error)
    return "I'm sorry, I couldn't provide advice at this time. Please consult with a healthcare professional for personalized fitness guidance."
  }
}
