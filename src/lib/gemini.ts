import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY

if (!apiKey) {
  throw new Error('Missing Gemini API key')
}

const genAI = new GoogleGenerativeAI(apiKey)

// Food Analysis Service
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

export const analyzeFoodDescription = async (description: string): Promise<FoodAnalysisResult> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `
Analyze the following food description and provide detailed nutritional information:

"${description}"

Please respond with a JSON object containing:
- calories: estimated total calories (number)
- protein: grams of protein (number) 
- carbs: grams of carbohydrates (number)
- fat: grams of fat (number)
- fiber: grams of fiber (number, optional)
- sugar: grams of sugar (number, optional) 
- sodium: milligrams of sodium (number, optional)
- confidence: confidence level 0-100 (number)
- breakdown: array of strings explaining the analysis for each food item

Be as accurate as possible based on standard nutritional data. If portions aren't specified, assume reasonable serving sizes.

Example response:
{
  "calories": 450,
  "protein": 35,
  "carbs": 25,
  "fat": 18,
  "fiber": 8,
  "sugar": 5,
  "sodium": 650,
  "confidence": 85,
  "breakdown": [
    "Grilled chicken breast (6oz): 280 calories, 30g protein",
    "Steamed broccoli (1 cup): 25 calories, 3g protein, 5g carbs",
    "Brown rice (1/2 cup): 110 calories, 2g protein, 22g carbs"
  ]
}
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response')
    }
    
    const analysis = JSON.parse(jsonMatch[0]) as FoodAnalysisResult
    
    // Validate required fields
    if (typeof analysis.calories !== 'number' || 
        typeof analysis.protein !== 'number' ||
        typeof analysis.carbs !== 'number' ||
        typeof analysis.fat !== 'number') {
      throw new Error('Invalid nutrition data from AI')
    }
    
    return analysis
  } catch (error) {
    console.error('Food analysis error:', error)
    // Fallback values
    return {
      calories: 300,
      protein: 15,
      carbs: 30,
      fat: 10,
      confidence: 50,
      breakdown: ['Unable to analyze - using estimated values']
    }
  }
}

// Exercise Analysis Service
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `
Analyze the following exercise description and provide detailed information:

"${description}"
${duration ? `Duration: ${duration} minutes` : ''}
${userWeight ? `User weight: ${userWeight} lbs` : 'Assume average weight of 150 lbs'}

Please respond with a JSON object containing:
- caloriesBurned: estimated calories burned (number)
- exerciseType: type of exercise - one of: "cardio", "strength", "flexibility", "sports", "other" 
- intensity: intensity level - one of: "light", "moderate", "vigorous", "high"
- confidence: confidence level 0-100 (number)
- breakdown: array of strings explaining the calorie calculation
- recommendations: optional array of improvement suggestions

Base calorie calculations on standard MET values and the provided or assumed body weight.

Example response:
{
  "caloriesBurned": 320,
  "exerciseType": "cardio",
  "intensity": "moderate", 
  "confidence": 90,
  "breakdown": [
    "Running at moderate pace: 8 METs",
    "30 minutes × 8 METs × 150 lbs = 320 calories"
  ],
  "recommendations": [
    "Great cardio workout! Try increasing pace gradually",
    "Consider adding strength training 2x per week"
  ]
}
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response')
    }
    
    const analysis = JSON.parse(jsonMatch[0]) as ExerciseAnalysisResult
    
    // Validate required fields
    if (typeof analysis.caloriesBurned !== 'number' ||
        !['cardio', 'strength', 'flexibility', 'sports', 'other'].includes(analysis.exerciseType) ||
        !['light', 'moderate', 'vigorous', 'high'].includes(analysis.intensity)) {
      throw new Error('Invalid exercise data from AI')
    }
    
    return analysis
  } catch (error) {
    console.error('Exercise analysis error:', error)
    // Fallback values
    return {
      caloriesBurned: duration ? Math.round(duration * 5) : 200,
      exerciseType: 'other',
      intensity: 'moderate',
      confidence: 50,
      breakdown: ['Unable to analyze - using estimated values']
    }
  }
}

// General AI Chat Service for fitness advice
export const getFitnessAdvice = async (question: string, userContext?: {
  age?: number
  weight?: number
  height?: number
  fitnessGoal?: string
  activityLevel?: string
}): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const contextStr = userContext ? `
User Context:
- Age: ${userContext.age || 'Not specified'}
- Weight: ${userContext.weight || 'Not specified'} lbs
- Height: ${userContext.height || 'Not specified'} inches  
- Fitness Goal: ${userContext.fitnessGoal || 'Not specified'}
- Activity Level: ${userContext.activityLevel || 'Not specified'}
` : ''

    const prompt = `
You are a helpful fitness and nutrition assistant. Answer the following question with accurate, personalized advice.

${contextStr}

Question: "${question}"

Please provide:
1. A clear, helpful answer
2. Actionable recommendations
3. Any important safety considerations
4. Encouragement and motivation

Keep the response concise but comprehensive (2-3 paragraphs maximum).
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Fitness advice error:', error)
    return "I'm sorry, I couldn't provide advice at this time. Please consult with a healthcare professional for personalized fitness guidance."
  }
}