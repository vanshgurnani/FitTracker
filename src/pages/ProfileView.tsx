import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";

const ProfileView: React.FC = () => {
  const { userProfile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userProfile) {
      setLoading(true);
      refreshProfile().finally(() => setLoading(false));
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center" style={{ minHeight: "calc(100vh - 4rem)" }}>
          <div>Loading profile…</div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
        <Navigation />
        <div className="container mx-auto px-4 py-8 pb-20 md:pb-8 flex items-center justify-center">
          <Card>
          <CardHeader>
            <CardTitle>No profile found</CardTitle>
            <CardDescription>You don't have a profile yet. Create one to get personalized recommendations.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button asChild>
                <Link to="/profile">Create Profile</Link>
              </Button>
            </div>
          </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <Navigation />
      <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="flex items-center gap-4">
              <Avatar>
                <AvatarFallback>{(userProfile.fullName || userProfile.email || "?").charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{userProfile.fullName ?? userProfile.email}</CardTitle>
                <CardDescription>{userProfile.email}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="mt-6 flex gap-3">
                <Button asChild>
                  <Link to="/profile">Edit Profile</Link>
                </Button>
                <Button variant="outline" onClick={() => refreshProfile()}>
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
