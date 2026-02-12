import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { ActivityLevel, FitnessGoal, UserProfile } from "@/lib/types";
import Navigation from "@/components/Navigation";

const Profile = () => {
  const { userProfile, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [age, setAge] = useState<number | string>("");
  const [gender, setGender] = useState<string>("");
  const [height, setHeight] = useState<number | string>("");
  const [weight, setWeight] = useState<number | string>("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("sedentary");
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>("lose_weight");

  useEffect(() => {
    if (userProfile) {
      setAge(userProfile.age || "");
      setGender((userProfile as any).gender || "");
      setHeight(userProfile.height || "");
      setWeight(userProfile.weight || "");
      setActivityLevel(userProfile.activityLevel || "sedentary");
      setFitnessGoal(userProfile.fitnessGoal || "lose_weight");
      // if there's no profile yet, open edit mode so user can create
      if (!userProfile.age && !userProfile.height && !userProfile.weight) {
        setIsEditing(true);
      }
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const updates: Partial<UserProfile> = {
      age: Number(age),
      height: Number(height),
      weight: Number(weight),
      activityLevel: activityLevel,
      fitnessGoal: fitnessGoal,
      gender: gender as any,
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
      case "active":
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

    updates.dailyCaloricGoal = dailyCalorieGoal;

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
      // if we were editing inline, close editor; otherwise navigate to dashboard
      if (isEditing) {
        setIsEditing(false);
      } else {
        navigate("/dashboard");
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            {!isEditing ? (
              <>
                <CardHeader className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <CardTitle className="text-2xl font-bold">Your Profile</CardTitle>
    
                    <button
                      aria-label="Edit profile"
                      title="Edit profile"
                      onClick={() => setIsEditing(true)}
                      className="p-2 rounded hover:bg-muted flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-muted-foreground">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                      </svg>
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Name</div>
                      <div className="font-medium">{(userProfile as any).fullName ?? userProfile.email}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="font-medium">{userProfile.email}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Age</div>
                      <div className="font-medium">{userProfile.age ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Gender</div>
                      <div className="font-medium">{(userProfile as any).gender ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Height (cm)</div>
                      <div className="font-medium">{userProfile.height ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Weight (kg)</div>
                      <div className="font-medium">{userProfile.weight ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Activity Level</div>
                      <div className="font-medium">{userProfile.activityLevel ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Fitness Goal</div>
                      <div className="font-medium">{userProfile.fitnessGoal ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Daily Calorie Goal</div>
                      <div className="font-medium">{userProfile.dailyCaloricGoal ?? "—"}</div>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Set Up Your Profile</CardTitle>
                <CardDescription>
                  Tell us about yourself to get personalized recommendations
                </CardDescription>
              </CardHeader>
            )}

            {isEditing && (
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
                    <Select required value={activityLevel} onValueChange={(value) => setActivityLevel(value as ActivityLevel)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your activity level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">Sedentary (little to no exercise)</SelectItem>
                        <SelectItem value="light">Light activity (1-3 days/week)</SelectItem>
                        <SelectItem value="moderate">Moderate activity (3-5 days/week)</SelectItem>
                      <SelectItem value="active">High activity (6-7 days/week)</SelectItem>
                        <SelectItem value="very_active">Very high activity (2x/day, intense)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goal">Fitness Goal</Label>
                    <Select required value={fitnessGoal} onValueChange={(value) => setFitnessGoal(value as FitnessGoal)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lose_weight">Lose Weight</SelectItem>
                        <SelectItem value="maintain_weight">Maintain Weight</SelectItem>
                        <SelectItem value="gain_weight">Gain Weight</SelectItem>
                        <SelectItem value="build_muscle">Build Muscle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" className="flex-1" disabled={isLoading}>
                      {isLoading ? "Saving..." : "Save Profile"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setIsEditing(false); }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;