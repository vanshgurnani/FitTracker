import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { User } from "@/lib/supabase";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const calculateNutrientGoals = (user: Partial<User>) => {
  const { age, gender, height, weight, activity_level, fitness_goal } = user;

  if (!age || !gender || !height || !weight || !activity_level || !fitness_goal) {
    return {
      tdee: 0,
      proteinGoal: 0,
      carbsGoal: 0,
      fatGoal: 0,
    };
  }

  // Convert weight to kg and height to cm if they are in pounds and inches
  // Assuming weight is in kg and height is in cm as per the form
  const weightInKg = Number(weight);
  const heightInCm = Number(height);

  let bmr = 0;
  if (gender === "male") {
    bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * age + 5;
  } else {
    bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * age - 161;
  }

  let activityMultiplier = 1.2;
  switch (activity_level) {
    case "light":
      activityMultiplier = 1.375;
      break;
    case "moderate":
      activityMultiplier = 1.55;
      break;
    case "active":
      activityMultiplier = 1.725;
      break;
    case "very_active":
      activityMultiplier = 1.9;
      break;
  }

  let tdee = bmr * activityMultiplier;

  // Adjust TDEE based on fitness goal
  switch (fitness_goal) {
    case "lose_weight":
      tdee -= 500; // Calorie deficit
      break;
    case "gain_weight":
    case "build_muscle":
      tdee += 500; // Calorie surplus
      break;
  }

  // Calculate macronutrient goals based on TDEE
  const proteinGoal = Math.round(2 * weightInKg); // 2g per kg of body weight
  const fatGoal = Math.round(0.9 * weightInKg); // 0.9g per kg of body weight

  const proteinCalories = proteinGoal * 4;
  const fatCalories = fatGoal * 9;
  const remainingCalories = tdee - proteinCalories - fatCalories;
  const carbsGoal = Math.round(remainingCalories / 4);

  return {
    tdee: Math.round(tdee),
    proteinGoal,
    carbsGoal,
    fatGoal,
  };
};
