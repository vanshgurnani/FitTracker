export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type FitnessGoal =
  | "lose_weight"
  | "maintain_weight"
  | "gain_weight"
  | "build_muscle";

export type Gender = "male" | "female" | "other";

export interface UserProfile {
  _id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;

  age?: number;
  gender?: Gender;
  weight?: number; // stored as-entered by UI (kg)
  height?: number; // stored as-entered by UI (cm)
  activityLevel?: ActivityLevel;
  dailyCaloricGoal?: number;
  fitnessGoal?: FitnessGoal;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface FoodLog {
  id: string;
  description: string;
  mealType: MealType;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  aiAnalysis?: string;
  createdAt: string;
}

export type ExerciseType =
  | "cardio"
  | "strength"
  | "flexibility"
  | "sports"
  | "other";

export type ExerciseIntensity = "light" | "moderate" | "vigorous" | "high";

export interface ExerciseLog {
  id: string;
  description: string;
  exerciseType: ExerciseType;
  durationMinutes: number;
  intensity: ExerciseIntensity;
  caloriesBurned: number;
  aiAnalysis?: string;
  createdAt: string;
}

