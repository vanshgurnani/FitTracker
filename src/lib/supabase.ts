import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey || 
    supabaseUrl.includes('your-project') || 
    supabaseAnonKey.includes('your-anon-key')) {
  console.error('❌ Supabase Configuration Error:')
  console.error('Please update your .env file with actual Supabase credentials')
  console.error('Get them from: https://supabase.com/dashboard/project/[your-project]/settings/api')
  throw new Error('Missing or invalid Supabase environment variables. Check console for details.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
  // User profile data
  age?: number
  weight?: number
  height?: number
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  daily_calorie_goal?: number
  fitness_goal?: 'lose_weight' | 'maintain_weight' | 'gain_weight' | 'build_muscle'
}

export interface FoodLog {
  id: string
  user_id: string
  description: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  calories: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
  sugar?: number
  sodium?: number
  ai_analysis?: string
  created_at: string
  updated_at: string
}

export interface ExerciseLog {
  id: string
  user_id: string
  description: string
  exercise_type: 'cardio' | 'strength' | 'flexibility' | 'sports' | 'other'
  duration_minutes: number
  intensity: 'light' | 'moderate' | 'vigorous' | 'high'
  calories_burned: number
  ai_analysis?: string
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
      }
      food_logs: {
        Row: FoodLog
        Insert: Omit<FoodLog, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<FoodLog, 'id' | 'created_at' | 'updated_at'>>
      }
      exercise_logs: {
        Row: ExerciseLog
        Insert: Omit<ExerciseLog, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ExerciseLog, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}