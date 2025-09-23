import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "@/lib/supabase";

const Profile = () => {
  const { userProfile, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [age, setAge] = useState<number | string>("");
  const [gender, setGender] = useState<string>("");
  const [height, setHeight] = useState<number | string>("");
  const [weight, setWeight] = useState<number | string>("");
  const [activityLevel, setActivityLevel] = useState<User['activity_level']>('sedentary');
  const [fitnessGoal, setFitnessGoal] = useState<User['fitness_goal']>('lose_weight');

  useEffect(() => {
    if (userProfile) {
      setAge(userProfile.age || "");
      setGender(userProfile.gender || ""); // Assuming gender is part of User profile
      setHeight(userProfile.height || "");
      setWeight(userProfile.weight || "");
      setActivityLevel(userProfile.activity_level || "sedentary");
      setFitnessGoal(userProfile.fitness_goal || "lose_weight");
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const updates: Partial<User> = {
      age: Number(age),
      gender: gender,
      height: Number(height),
      weight: Number(weight),
      activity_level: activityLevel,
      fitness_goal: fitnessGoal,
    };

    // Calculate BMR (Mifflin-St Jeor Equation)
    let bmr = 0;
    const ageNum = Number(age);
    const heightNum = Number(height);
    const weightNum = Number(weight);

    if (gender === "male") {
      bmr = (10 * weightNum) + (6.25 * heightNum) - (5 * ageNum) + 5;
    } else if (gender === "female") {
      bmr = (10 * weightNum) + (6.25 * heightNum) - (5 * ageNum) - 161;
    }

    // Activity Level Multiplier
    let activityMultiplier = 1.2; // Sedentary
    switch (activityLevel) {
      case "light":
        activityMultiplier = 1.375;
        break;
      case "moderate":
        activityMultiplier = 1.55;
        break;
      case "high":
        activityMultiplier = 1.725;
        break;
      case "very_active":
        activityMultiplier = 1.9;
        break;
    }

    let tdee = bmr * activityMultiplier;
    let dailyCalorieGoal = Math.round(tdee);

    // Adjust for Fitness Goal
    switch (fitnessGoal) {
      case "lose_weight":
        dailyCalorieGoal -= 500; // Moderate deficit
        break;
      case "gain_weight":
      case "build_muscle":
        dailyCalorieGoal += 500; // Moderate surplus
        break;
      // For maintain_weight and improve_fitness, no change to TDEE
    }

    updates.daily_calorie_goal = dailyCalorieGoal;

    const { error } = await updateProfile(updates);

    if (error) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile updated!",
        description: "Your profile has been saved successfully.",
      });
      navigate("/dashboard");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Set Up Your Profile</CardTitle>
              <CardDescription>
                Tell us about yourself to get personalized recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="25"
                      min="13"
                      max="120"
                      required
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select required value={gender} onValueChange={setGender}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="175"
                      min="100"
                      max="250"
                      required
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="70"
                      min="30"
                      max="300"
                      required
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activity">Activity Level</Label>
                  <Select required value={activityLevel} onValueChange={setActivityLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your activity level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary (little to no exercise)</SelectItem>
                      <SelectItem value="light">Light activity (1-3 days/week)</SelectItem>
                      <SelectItem value="moderate">Moderate activity (3-5 days/week)</SelectItem>
                      <SelectItem value="high">High activity (6-7 days/week)</SelectItem>
                      <SelectItem value="very_active">Very high activity (2x/day, intense)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal">Fitness Goal</Label>
                  <Select required value={fitnessGoal} onValueChange={setFitnessGoal}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lose_weight">Lose Weight</SelectItem>
                      <SelectItem value="maintain_weight">Maintain Weight</SelectItem>
                      <SelectItem value="gain_weight">Gain Weight</SelectItem>
                      <SelectItem value="build_muscle">Build Muscle</SelectItem>
                      <SelectItem value="improve_fitness">Improve Fitness</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Profile"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link to="/dashboard">Skip for now</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;