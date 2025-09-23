import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Target, Sparkles, Users, TrendingUp } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered Fitness Tracking
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Track Your Fitness Journey with AI
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Log your meals and workouts naturally. Our AI calculates calories and provides personalized insights to help you reach your fitness goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-lg px-8">
                <Link to="/login">
                  Get Started Free
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <Card className="text-center">
            <CardHeader>
              <div className="bg-gradient-to-r from-primary to-accent p-3 rounded-full w-fit mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <CardTitle>AI-Powered Logging</CardTitle>
              <CardDescription>
                Simply describe what you ate or your workout in natural language. Our AI calculates calories automatically.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="bg-gradient-to-r from-primary to-accent p-3 rounded-full w-fit mx-auto mb-4">
                <Target className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Smart Goal Tracking</CardTitle>
              <CardDescription>
                Set personalized goals based on your profile and track your daily progress with intelligent insights.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="bg-gradient-to-r from-primary to-accent p-3 rounded-full w-fit mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Beautiful Analytics</CardTitle>
              <CardDescription>
                Visualize your progress with intuitive charts and get AI-powered recommendations for better results.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
