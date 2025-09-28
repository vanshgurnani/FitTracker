import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FoodLog, User } from "@/lib/supabase";
import { calculateNutrientGoals } from "@/lib/utils";

interface NutrientGoalsProps {
  userProfile: Partial<User> | null;
  foodLogs: FoodLog[];
}

const NutrientGoals = ({ userProfile, foodLogs }: NutrientGoalsProps) => {
  const { proteinGoal, carbsGoal, fatGoal } = useMemo(() => {
    if (!userProfile) {
      return { proteinGoal: 0, carbsGoal: 0, fatGoal: 0 };
    }
    return calculateNutrientGoals(userProfile);
  }, [userProfile]);

  const currentIntake = useMemo(() => {
    return foodLogs.reduce(
      (acc, log) => {
        acc.protein += log.protein || 0;
        acc.carbs += log.carbs || 0;
        acc.fat += log.fat || 0;
        return acc;
      },
      { protein: 0, carbs: 0, fat: 0 }
    );
  }, [foodLogs]);

  const proteinProgress = proteinGoal > 0 ? (currentIntake.protein / proteinGoal) * 100 : 0;
  const carbsProgress = carbsGoal > 0 ? (currentIntake.carbs / carbsGoal) * 100 : 0;
  const fatProgress = fatGoal > 0 ? (currentIntake.fat / fatGoal) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nutrient Goals</CardTitle>
        <CardDescription>Your daily macronutrient targets.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="font-medium">Protein</span>
            <span>
              {currentIntake.protein.toFixed(0)}g / {proteinGoal}g
            </span>
          </div>
          <Progress value={proteinProgress} />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="font-medium">Carbs</span>
            <span>
              {currentIntake.carbs.toFixed(0)}g / {carbsGoal}g
            </span>
          </div>
          <Progress value={carbsProgress} />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="font-medium">Fat</span>
            <span>
              {currentIntake.fat.toFixed(0)}g / {fatGoal}g
            </span>
          </div>
          <Progress value={fatProgress} />
        </div>
      </CardContent>
    </Card>
  );
};

export default NutrientGoals;
