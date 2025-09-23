import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, ExerciseLog as ExerciseLogType } from "@/lib/supabase";
import { analyzeExerciseDescription } from "@/lib/gemini";
import { Dumbbell, Heart, Timer, Flame, Sparkles, Trash2 } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

const ExerciseLog = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [exerciseDescription, setExerciseDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [intensity, setIntensity] = useState<'light' | 'moderate' | 'vigorous' | 'high'>('moderate');
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogType[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const { user, userProfile } = useAuth();

  const fetchExerciseLogsForDate = async (date: Date) => {
    if (!user) return;
    
    setLoadingLogs(true);
    try {
      const startOfDay = format(date, "yyyy-MM-dd") + "T00:00:00.000Z";
      const endOfDay = format(date, "yyyy-MM-dd") + "T23:59:59.999Z";
      
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching exercise logs:', error);
        toast({
          title: "Error loading exercise logs",
          description: "Please try again later.",
          variant: "destructive",
        });
      } else {
        setExerciseLogs(data || []);
      }
    } catch (error) {
      console.error('Error fetching exercise logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (user && selectedDate) {
      fetchExerciseLogsForDate(selectedDate);
    }
  }, [user, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseDescription.trim() || !user || !selectedDate) return;
    
    setIsLoading(true);
    
    try {
      const durationNum = duration ? parseInt(duration) : undefined;
      const userWeight = userProfile?.weight;
      
      // Analyze exercise with Gemini AI
      const analysis = await analyzeExerciseDescription(
        exerciseDescription, 
        durationNum, 
        userWeight
      );
      
      // Save to Supabase
      const { data, error } = await supabase
        .from('exercise_logs')
        .insert({
          user_id: user.id,
          description: exerciseDescription,
          exercise_type: analysis.exerciseType,
          duration_minutes: durationNum || 30, // Default to 30 if not specified
          intensity: analysis.intensity,
          calories_burned: analysis.caloriesBurned,
          ai_analysis: analysis.breakdown.join('\n'),
          created_at: selectedDate.toISOString(), // Use selectedDate for created_at
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Exercise logged successfully!",
        description: `AI calculated ${analysis.caloriesBurned} calories burned.`,
      });
      
      setExerciseDescription("");
      setDuration("");
      // Refresh the exercise logs to ensure consistency
      await fetchExerciseLogsForDate(selectedDate);
      
    } catch (error) {
      console.error('Error logging exercise:', error);
      toast({
        title: "Error logging exercise",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      const { error } = await supabase
        .from('exercise_logs')
        .delete()
        .eq('id', logId);

      if (error) {
        throw error;
      }

      // Refresh the exercise logs to ensure consistency
      if (selectedDate) {
        await fetchExerciseLogsForDate(selectedDate);
      }
      toast({
        title: "Exercise log deleted",
        description: "The exercise entry has been removed.",
      });
    } catch (error) {
      console.error('Error deleting exercise log:', error);
      toast({
        title: "Error deleting log",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const quickExercises = [
    { name: "Running (30 min)", calories: 300, icon: "🏃" },
    { name: "Walking (45 min)", calories: 180, icon: "🚶" },
    { name: "Cycling (30 min)", calories: 250, icon: "🚴" },
    { name: "Swimming (30 min)", calories: 350, icon: "🏊" },
    { name: "Weight Training (45 min)", calories: 220, icon: "🏋️" },
    { name: "Yoga (60 min)", calories: 150, icon: "🧘" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Log Your Exercise</h1>
              <p className="text-muted-foreground">
                Track your workouts and let AI calculate calories burned
              </p>
            </div>
          </div>

          {/* AI Exercise Analysis */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI-Powered Exercise Analysis
              </CardTitle>
              <CardDescription>
                Describe your workout and get instant calorie burn estimates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="exercise-description">What exercise did you do?</Label>
                  <Textarea
                    id="exercise-description"
                    placeholder="E.g., I ran for 30 minutes at a moderate pace, then did 15 minutes of strength training with dumbbells"
                    value={exerciseDescription}
                    onChange={(e) => setExerciseDescription(e.target.value)}
                    className="min-h-[100px]"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input 
                      id="duration" 
                      type="number" 
                      placeholder="30" 
                      min="1"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="intensity">Intensity</Label>
                    <Select value={intensity} onValueChange={(value: any) => setIntensity(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select intensity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="vigorous">Vigorous</SelectItem>
                        <SelectItem value="high">High Intensity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Calculating with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Calculate Calories Burned
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Add Exercises */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Quick Add Exercises
              </CardTitle>
              <CardDescription>
                Common workouts for quick logging
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quickExercises.map((exercise, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-4 flex items-center justify-between"
                    onClick={() => {
                      toast({
                        title: "Exercise added!",
                        description: `Added ${exercise.name} (${exercise.calories} calories burned)`,
                      });
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{exercise.icon}</span>
                      <span className="font-medium text-sm">{exercise.name}</span>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Flame className="h-3 w-3" />
                      {exercise.calories}
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Workouts for {selectedDate ? format(selectedDate, "PPP") : "Today"} */}
          <Card>
            <CardHeader>
              <DatePicker date={selectedDate} setDate={setSelectedDate} />
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Workouts for {selectedDate ? format(selectedDate, "PPP") : "Today"}
              </CardTitle>
              <CardDescription>
                Your logged exercises for {selectedDate ? format(selectedDate, "PPP") : "today"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : exerciseLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No workouts logged for {selectedDate ? format(selectedDate, "PPP") : "today"} yet.</p>
                  <p className="text-sm">Start by describing your exercise above!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {exerciseLogs.map((log) => {
                    const getExerciseIcon = (type: string) => {
                      switch (type) {
                        case 'cardio': return <Heart className="h-4 w-4 text-orange-600" />;
                        case 'strength': return <Dumbbell className="h-4 w-4 text-primary" />;
                        case 'flexibility': return <div className="h-4 w-4 text-green-600">🧘</div>;
                        case 'sports': return <div className="h-4 w-4 text-blue-600">⚽</div>;
                        default: return <Heart className="h-4 w-4 text-muted-foreground" />;
                      }
                    };

                    const getIntensityColor = (intensity: string) => {
                      switch (intensity) {
                        case 'light': return 'bg-green-100';
                        case 'moderate': return 'bg-yellow-100';
                        case 'vigorous': return 'bg-orange-100';
                        case 'high': return 'bg-red-100';
                        default: return 'bg-muted/50';
                      }
                    };

                    return (
                      <div key={log.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`p-2 rounded-full ${getIntensityColor(log.intensity)}`}>
                            {getExerciseIcon(log.exercise_type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium capitalize">{log.exercise_type}</h3>
                              <Badge variant="secondary" className="text-xs">
                                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-1">{log.description}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              {log.duration_minutes} minutes • {log.intensity} intensity
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            {log.calories_burned} cal
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLog(log.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total calories burned for {selectedDate ? format(selectedDate, "PPP") : "today"}:</span>
                      <Badge variant="outline" className="text-lg flex items-center gap-1">
                        <Flame className="h-4 w-4" />
                        {exerciseLogs.reduce((sum, log) => sum + log.calories_burned, 0)} calories
                      </Badge>
                    </div>
                    {exerciseLogs.length > 0 && (
                      <div className="flex justify-between items-center text-sm text-muted-foreground mt-2">
                        <span>Total duration:</span>
                        <span>{exerciseLogs.reduce((sum, log) => sum + log.duration_minutes, 0)} minutes</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExerciseLog;
