-- FitTracker Database Schema for Supabase
-- Run these commands in your Supabase SQL Editor

-- Enable RLS (Row Level Security)
-- This is automatically enabled for new Supabase projects

-- Create users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- User profile data
  age INTEGER CHECK (age > 0 AND age < 150),
  weight DECIMAL(5,2) CHECK (weight > 0), -- in pounds
  height DECIMAL(5,2) CHECK (height > 0), -- in inches
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  daily_calorie_goal INTEGER CHECK (daily_calorie_goal > 0),
  fitness_goal TEXT CHECK (fitness_goal IN ('lose_weight', 'maintain_weight', 'gain_weight', 'build_muscle'))
);

-- Create food_logs table
CREATE TABLE public.food_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
  calories INTEGER CHECK (calories >= 0) NOT NULL,
  protein DECIMAL(8,2) CHECK (protein >= 0),
  carbs DECIMAL(8,2) CHECK (carbs >= 0),
  fat DECIMAL(8,2) CHECK (fat >= 0),
  fiber DECIMAL(8,2) CHECK (fiber >= 0),
  sugar DECIMAL(8,2) CHECK (sugar >= 0),
  sodium DECIMAL(8,2) CHECK (sodium >= 0), -- in milligrams
  ai_analysis TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create exercise_logs table
CREATE TABLE public.exercise_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  exercise_type TEXT CHECK (exercise_type IN ('cardio', 'strength', 'flexibility', 'sports', 'other')) NOT NULL,
  duration_minutes INTEGER CHECK (duration_minutes > 0) NOT NULL,
  intensity TEXT CHECK (intensity IN ('light', 'moderate', 'vigorous', 'high')) NOT NULL,
  calories_burned INTEGER CHECK (calories_burned >= 0) NOT NULL,
  ai_analysis TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_food_logs_user_id ON public.food_logs(user_id);
CREATE INDEX idx_food_logs_created_at ON public.food_logs(created_at);
CREATE INDEX idx_food_logs_meal_type ON public.food_logs(meal_type);

CREATE INDEX idx_exercise_logs_user_id ON public.exercise_logs(user_id);
CREATE INDEX idx_exercise_logs_created_at ON public.exercise_logs(created_at);
CREATE INDEX idx_exercise_logs_exercise_type ON public.exercise_logs(exercise_type);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can only see and manage their own food logs
CREATE POLICY "Users can view own food logs" ON public.food_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food logs" ON public.food_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food logs" ON public.food_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own food logs" ON public.food_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Users can only see and manage their own exercise logs
CREATE POLICY "Users can view own exercise logs" ON public.exercise_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercise logs" ON public.exercise_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercise logs" ON public.exercise_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercise logs" ON public.exercise_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Create functions to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_logs_updated_at BEFORE UPDATE ON public.food_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_logs_updated_at BEFORE UPDATE ON public.exercise_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create useful views for analytics

-- Daily nutrition summary view
CREATE VIEW daily_nutrition_summary AS
SELECT 
  user_id,
  DATE(created_at) as log_date,
  SUM(calories) as total_calories,
  SUM(protein) as total_protein,
  SUM(carbs) as total_carbs,
  SUM(fat) as total_fat,
  SUM(fiber) as total_fiber,
  COUNT(*) as meal_count
FROM public.food_logs
GROUP BY user_id, DATE(created_at);

-- Daily exercise summary view  
CREATE VIEW daily_exercise_summary AS
SELECT 
  user_id,
  DATE(created_at) as log_date,
  SUM(calories_burned) as total_calories_burned,
  SUM(duration_minutes) as total_duration,
  COUNT(*) as exercise_count,
  ARRAY_AGG(DISTINCT exercise_type) as exercise_types
FROM public.exercise_logs
GROUP BY user_id, DATE(created_at);

-- Weekly progress view
CREATE VIEW weekly_progress AS
SELECT 
  u.id as user_id,
  u.daily_calorie_goal,
  DATE_TRUNC('week', COALESCE(f.log_date, e.log_date)) as week_start,
  COALESCE(AVG(f.total_calories), 0) as avg_daily_calories,
  COALESCE(AVG(e.total_calories_burned), 0) as avg_daily_calories_burned,
  COALESCE(AVG(f.total_calories - e.total_calories_burned), 0) as avg_net_calories
FROM public.users u
LEFT JOIN daily_nutrition_summary f ON u.id = f.user_id
LEFT JOIN daily_exercise_summary e ON u.id = e.user_id AND f.log_date = e.log_date
WHERE COALESCE(f.log_date, e.log_date) >= CURRENT_DATE - INTERVAL '4 weeks'
GROUP BY u.id, u.daily_calorie_goal, DATE_TRUNC('week', COALESCE(f.log_date, e.log_date))
ORDER BY week_start DESC;