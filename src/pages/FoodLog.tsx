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
import { supabase, FoodLog as FoodLogType } from "@/lib/supabase";
import { analyzeFoodDescription } from "@/lib/gemini";
import { Search, Camera, Utensils, Sparkles, Trash2 } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

const FoodLog = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [foodDescription, setFoodDescription] = useState("");
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [foodLogs, setFoodLogs] = useState<FoodLogType[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const { user } = useAuth();

  const fetchFoodLogsForDate = async (date: Date) => {
    if (!user) return;
    
    setLoadingLogs(true);
    try {
      const startOfDay = format(date, "yyyy-MM-dd") + "T00:00:00.000Z";
      const endOfDay = format(date, "yyyy-MM-dd") + "T23:59:59.999Z";
      
      const { data, error } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching food logs:', error);
        toast({
          title: "Error loading food logs",
          description: "Please try again later.",
          variant: "destructive",
        });
      } else {
        setFoodLogs(data || []);
      }
    } catch (error) {
      console.error('Error fetching food logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (user && selectedDate) {
      fetchFoodLogsForDate(selectedDate);
    }
  }, [user, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodDescription.trim() || !user || !selectedDate) return;
    
    setIsLoading(true);
    
    try {
      // Analyze food with Gemini AI
      const analysis = await analyzeFoodDescription(foodDescription);
      
      // Save to Supabase
      const { data, error } = await supabase
        .from('food_logs')
        .insert({
          user_id: user.id,
          description: foodDescription,
          meal_type: mealType,
          calories: analysis.calories,
          protein: analysis.protein,
          carbs: analysis.carbs,
          fat: analysis.fat,
          fiber: analysis.fiber,
          sugar: analysis.sugar,
          sodium: analysis.sodium,
          ai_analysis: analysis.breakdown.join('\n'),
          created_at: selectedDate.toISOString(), // Use selectedDate for created_at
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Food logged successfully!",
        description: `AI calculated ${analysis.calories} calories for your ${mealType}.`,
      });
      
      setFoodDescription("");
      // Refresh the food logs to ensure consistency
      await fetchFoodLogsForDate(selectedDate);
      
    } catch (error) {
      console.error('Error logging food:', error);
      toast({
        title: "Error logging food",
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
        .from('food_logs')
        .delete()
        .eq('id', logId);

      if (error) {
        throw error;
      }

      // Refresh the food logs to ensure consistency
      if (selectedDate) {
        await fetchFoodLogsForDate(selectedDate);
      }
      toast({
        title: "Food log deleted",
        description: "The food entry has been removed.",
      });
    } catch (error) {
      console.error('Error deleting food log:', error);
      toast({
        title: "Error deleting log",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const quickAddItems = [
    { name: "Banana", calories: 105 },
    { name: "Apple", calories: 95 },
    { name: "Greek Yogurt", calories: 150 },
    { name: "Almonds (1oz)", calories: 164 },
    { name: "Chicken Breast (100g)", calories: 231 },
    { name: "Brown Rice (1 cup)", calories: 216 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Log Your Food</h1>
              <p className="text-muted-foreground">
                Describe what you ate and let AI calculate the calories for you
              </p>
            </div>
          </div>

          {/* AI Food Analysis */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI-Powered Food Analysis
              </CardTitle>
              <CardDescription>
                Describe your meal in natural language and get instant calorie estimates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="meal-type">Meal Type</Label>
                    <Select value={mealType} onValueChange={(value: any) => setMealType(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select meal type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                        <SelectItem value="snack">Snack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="food-description">What did you eat?</Label>
                  <Textarea
                    id="food-description"
                    placeholder="E.g., I had a grilled chicken breast with steamed broccoli and a small portion of brown rice, plus a glass of orange juice"
                    value={foodDescription}
                    onChange={(e) => setFoodDescription(e.target.value)}
                    className="min-h-[100px]"
                    required
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Calculate Calories
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" size="icon">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Quick Add */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Quick Add
              </CardTitle>
              <CardDescription>
                Common foods for quick logging
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {quickAddItems.map((item, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-3 flex flex-col items-start"
                    onClick={() => setFoodDescription(item.name)}
                  >
                    <span className="font-medium text-sm">{item.name}</span>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {item.calories} cal
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Meals for {selectedDate ? format(selectedDate, "PPP") : "Today"} */}
          <Card>
            <CardHeader>
              <DatePicker date={selectedDate} setDate={setSelectedDate} />
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Meals for {selectedDate ? format(selectedDate, "PPP") : "Today"}
              </CardTitle>
              <CardDescription>
                Your logged food for {selectedDate ? format(selectedDate, "PPP") : "today"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 text-muted-foreground">Loading your meals...</span>
                </div>
              ) : foodLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No meals logged for {selectedDate ? format(selectedDate, "PPP") : "today"} yet.</p>
                  <p className="text-sm">Start by describing what you ate above!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {foodLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium capitalize">{log.meal_type}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{log.description}</p>
                        {(log.protein || log.carbs || log.fat) && (
                          <div className="flex gap-2 mt-2">
                            {log.protein && <Badge variant="outline" className="text-xs">P: {log.protein}g</Badge>}
                            {log.carbs && <Badge variant="outline" className="text-xs">C: {log.carbs}g</Badge>}
                            {log.fat && <Badge variant="outline" className="text-xs">F: {log.fat}g</Badge>}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{log.calories} cal</Badge>
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
                  ))}

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total for {selectedDate ? format(selectedDate, "PPP") : "today"}:</span>
                      <Badge variant="outline" className="text-lg">
                        {foodLogs.reduce((sum, log) => sum + log.calories, 0)} calories
                      </Badge>
                    </div>
                    {foodLogs.length > 0 && (
                      <div className="flex justify-between items-center text-sm text-muted-foreground mt-2">
                        <span>Macros:</span>
                        <div className="flex gap-3">
                          <span>P: {foodLogs.reduce((sum, log) => sum + (log.protein || 0), 0).toFixed(1)}g</span>
                          <span>C: {foodLogs.reduce((sum, log) => sum + (log.carbs || 0), 0).toFixed(1)}g</span>
                          <span>F: {foodLogs.reduce((sum, log) => sum + (log.fat || 0), 0).toFixed(1)}g</span>
                        </div>
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

export default FoodLog;
