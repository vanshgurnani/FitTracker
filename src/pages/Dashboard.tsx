import { useState, useEffect, useRef, forwardRef } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, FoodLog, ExerciseLog } from "@/lib/supabase";
import {
  CalendarDays,
  Target,
  TrendingUp,
  Utensils,
  Dumbbell,
  Flame,
  Share2,
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import html2canvas from "html2canvas";

// This component is rendered off-screen and used to generate the shareable image.
const ShareCard = forwardRef<
  HTMLDivElement,
  {
    date: Date | undefined;
    user: { full_name?: string } | null;
    stats: {
      consumed: number;
      burned: number;
      netCalories: number;
      dailyGoal: number;
      remaining: number;
    };
  }
>(({ date, user, stats }, ref) => {
  const dateString = date ? format(date, "PPP") : "Today";

  return (
    <div
      ref={ref}
      className="fixed top-0 left-[-9999px] w-[400px] bg-background border border-border p-6 font-sans"
      style={{
        // Ensure fonts and styles are loaded, might need a small delay before capture
        fontFamily: `'Inter', sans-serif`,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">FitTracker Summary</h2>
        <Flame className="h-6 w-6 text-primary" />
      </div>
      <p className="text-muted-foreground mb-1">
        {user?.full_name ? `${user.full_name}'s Progress` : "My Progress"} for{" "}
        {dateString}
      </p>
      <div className="space-y-3 mt-4">
        <div className="flex justify-between items-center">
          <span className="font-medium">Calories Consumed</span>
          <span className="font-bold text-primary">{stats.consumed} kcal</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium">Calories Burned</span>
          <span className="font-bold text-orange-600">{stats.burned} kcal</span>
        </div>
        <div className="flex justify-between items-center border-t pt-3 mt-3">
          <span className="font-medium">Net Calories</span>
          <span className="font-bold">{stats.netCalories} kcal</span>
        </div>
      </div>
      <div className="mt-4 text-center text-sm text-muted-foreground">
        {stats.remaining > 0
          ? `You have ${
              stats.remaining
            } calories remaining to reach your goal of ${stats.dailyGoal} kcal.`
          : `You are ${Math.abs(
              stats.remaining
            )} calories over your goal of ${stats.dailyGoal} kcal.`}
      </div>
      <p className="text-center text-xs text-muted-foreground mt-4">
        Shared from FitTracker
      </p>
    </div>
  );
});

const Dashboard = () => {
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const shareCardRef = useRef<HTMLDivElement>(null);

  const { user, userProfile } = useAuth();

  const fetchDataForDate = async (date: Date) => {
    if (!user) return;

    setLoading(true);
    try {
      const startOfDay = format(date, "yyyy-MM-dd") + "T00:00:00.000Z";
      const endOfDay = format(date, "yyyy-MM-dd") + "T23:59:59.999Z";

      const { data: foodData, error: foodError } = await supabase
        .from("food_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", startOfDay)
        .lt("created_at", endOfDay)
        .order("created_at", { ascending: false });

      const { data: exerciseData, error: exerciseError } = await supabase
        .from("exercise_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", startOfDay)
        .lt("created_at", endOfDay)
        .order("created_at", { ascending: false });

      if (foodError || exerciseError) {
        console.error("Error fetching data:", foodError || exerciseError);
      } else {
        setFoodLogs(foodData || []);
        setExerciseLogs(exerciseData || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchDataForDate(selectedDate);
    }
  }, [user, selectedDate]);

  const dailyGoal = userProfile?.daily_calorie_goal || 2000;
  const consumed = foodLogs.reduce((sum, log) => sum + log.calories, 0);
  const burned = exerciseLogs.reduce(
    (sum, log) => sum + log.calories_burned,
    0
  );
  const netCalories = consumed - burned;
  const remaining = dailyGoal - netCalories;
  const progressPercentage = Math.min((netCalories / dailyGoal) * 100, 100);

  const recentActivity = [
    ...foodLogs.map((log) => ({ ...log, type: "food" as const })),
    ...exerciseLogs.map((log) => ({ ...log, type: "exercise" as const })),
  ]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  const handleShare = async () => {
    const dateString = selectedDate ? format(selectedDate, "PPP") : "today";
    const shareText = `Check out my calorie summary for ${dateString} on FitTracker!`;

    if (!shareCardRef.current) {
      console.error("Share card ref is not attached.");
      alert("Could not capture summary for sharing.");
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(shareCardRef.current, {
        useCORS: true,
        scale: 1,
        backgroundColor: null,
      });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );

      if (!blob) {
        console.error("Failed to create blob from canvas.");
        alert("Could not generate image for sharing.");
        return;
      }

      const file = new File(
        [blob],
        `fittracker-summary-${format(selectedDate || new Date(), "yyyyMMdd")}.png`,
        { type: "image/png" }
      );

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: `FitTracker Summary - ${dateString}`,
          text: shareText,
          files: [file],
        });
        console.log("Content and image shared successfully");
      } else {
        console.log(
          "Web Share API with files not supported. Copying text and offering image download."
        );
        await navigator.clipboard.writeText(shareText);
        alert(
          "Share text copied to clipboard! Image download will start shortly."
        );

        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `fittracker-summary-${format(
          selectedDate || new Date(),
          "yyyyMMdd"
        )}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error sharing summary image:", error);
      alert(
        "An error occurred while trying to share your summary. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <Navigation />

      <ShareCard
        ref={shareCardRef}
        date={selectedDate}
        user={userProfile}
        stats={{ consumed, burned, netCalories, dailyGoal, remaining }}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back
              {userProfile?.full_name ? `, ${userProfile.full_name}` : ""}!
            </h1>
            <p className="text-muted-foreground">
              Here's your fitness progress for{" "}
              {selectedDate ? format(selectedDate, "PPP") : "today"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DatePicker date={selectedDate} setDate={setSelectedDate} />
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Calories Consumed
                  </CardTitle>
                  <Utensils className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {consumed}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    from {foodLogs.length} meals
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Calories Burned
                  </CardTitle>
                  <Flame className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {burned}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    from {exerciseLogs.length} workouts
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Net Calories
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{netCalories}</div>
                  <p className="text-xs text-muted-foreground">
                    {remaining > 0
                      ? `${remaining} remaining`
                      : `${Math.abs(remaining)} over goal`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Daily Progress
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(progressPercentage)}%
                  </div>
                  <Progress value={progressPercentage} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Daily Calorie Goal
                  </CardTitle>
                  <CardDescription>
                    Track your progress toward your daily target
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Daily Goal</span>
                      <Badge variant="outline">{dailyGoal} cal</Badge>
                    </div>
                    <Progress value={progressPercentage} className="h-3" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>
                        {netCalories} / {dailyGoal} calories
                      </span>
                      <span>
                        {remaining > 0
                          ? `${remaining} left`
                          : `${Math.abs(remaining)} over`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Log your meals and workouts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button asChild className="w-full">
                    <Link to="/food-log" className="flex items-center gap-2">
                      <Utensils className="h-4 w-4" />
                      Log Food
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link
                      to="/exercise-log"
                      className="flex items-center gap-2"
                    >
                      <Dumbbell className="h-4 w-4" />
                      Log Exercise
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>
                        No activity logged for{" "}
                        {selectedDate
                          ? format(selectedDate, "PPP")
                          : "today"}{" "}
                        yet.
                      </p>
                      <p className="text-sm">
                        Start by logging your meals and workouts!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div
                          key={`${activity.type}-${activity.id}`}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-full ${
                                activity.type === "food"
                                  ? "bg-primary/10"
                                  : "bg-orange-100"
                              }`}
                            >
                              {activity.type === "food" ? (
                                <Utensils className="h-4 w-4 text-primary" />
                              ) : (
                                <Dumbbell className="h-4 w-4 text-orange-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium line-clamp-1">
                                {activity.type === "food"
                                  ? (activity as FoodLog & { type: "food" })
                                      .description
                                  : (
                                      activity as ExerciseLog & {
                                        type: "exercise";
                                      }
                                    ).description}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {activity.type === "food" ? (
                                  <>
                                    <span className="capitalize">
                                      {(activity as FoodLog).meal_type}
                                    </span>{" "}
                                    • {(activity as FoodLog).calories} calories
                                  </>
                                ) : (
                                  <>
                                    <span className="capitalize">
                                      {(activity as ExerciseLog).exercise_type}
                                    </span>{" "}
                                    •{" "}
                                    {(activity as ExerciseLog)
                                      .calories_burned}{" "}
                                    calories burned
                                    {(activity as ExerciseLog)
                                      .duration_minutes && (
                                      <>
                                        {" "}
                                        •{" "}
                                        {
                                          (activity as ExerciseLog)
                                            .duration_minutes
                                        }{" "}
                                        min
                                      </>
                                    )}
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {new Date(activity.created_at).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;