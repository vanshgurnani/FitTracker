# FitTracker - AI-Powered Fitness Tracking App

A modern fitness tracking application built with React, TypeScript, Supabase, and Google's Gemini AI. Track your meals and workouts with natural language descriptions and get AI-powered calorie calculations and insights.

## 🚀 Features

- **AI-Powered Food Analysis**: Describe what you ate in natural language and get detailed nutritional breakdowns
- **Smart Exercise Logging**: Log workouts with AI calculating calories burned based on activity, duration, and intensity
- **Real-time Dashboard**: Track daily progress with comprehensive stats and recent activity
- **User Authentication**: Secure signup/login with Supabase Auth
- **Personalized Goals**: Set and track daily calorie goals based on your profile
- **Responsive Design**: Beautiful UI that works on all devices
- **Data Persistence**: All data stored securely in Supabase PostgreSQL database

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: Shadcn/ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **AI Integration**: Google Gemini AI (gemini-1.5-flash)
- **State Management**: React Context API, TanStack Query
- **Routing**: React Router DOM
- **Form Handling**: React Hook Form with Zod validation

## 📋 Prerequisites

Before running this application, make sure you have:

1. **Node.js** (v18 or higher)
2. **npm** or **yarn** package manager
3. **Supabase Account** - [Create one here](https://supabase.com)
4. **Google AI Studio Account** - [Get API key here](https://makersuite.google.com/app/apikey)

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fittracker
npm install
```

### 2. Environment Configuration

Copy the example environment file and update with your credentials:

```bash
cp .env.example .env
```

Update `.env` with your actual values:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Generative AI Configuration  
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### 3. Supabase Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL commands from `database-schema.sql` to create the required tables, policies, and triggers

The schema includes:
- `users` table (extends auth.users with profile data)
- `food_logs` table (stores meal entries with AI analysis)
- `exercise_logs` table (stores workout entries with AI analysis)
- Row Level Security (RLS) policies
- Helpful views for analytics
- Automatic timestamp triggers

### 4. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/ui components
│   └── Navigation.tsx  # Main navigation component
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state management
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
│   ├── supabase.ts    # Supabase client & types
│   ├── gemini.ts      # Gemini AI integration
│   └── utils.ts       # General utilities
├── pages/              # Page components
│   ├── Index.tsx      # Landing page
│   ├── Login.tsx      # Authentication
│   ├── Dashboard.tsx  # Main dashboard
│   ├── FoodLog.tsx    # Food logging
│   ├── ExerciseLog.tsx# Exercise logging
│   └── Profile.tsx    # User profile
└── App.tsx            # Main app component
```

## 🤖 AI Integration Details

### Food Analysis (Gemini AI)
- Analyzes natural language food descriptions
- Returns detailed nutritional information:
  - Calories, protein, carbs, fat
  - Optional: fiber, sugar, sodium
  - Confidence score and breakdown
- Handles complex meals with multiple items
- Provides fallback estimates if analysis fails

### Exercise Analysis (Gemini AI)
- Processes workout descriptions with context
- Considers user weight and duration for accuracy
- Returns:
  - Calories burned calculation
  - Exercise type classification
  - Intensity level assessment
  - Detailed breakdown and recommendations
- Uses MET values for scientific accuracy

## 🏛️ Architecture Overview

The FitTracker application follows a modern client-server architecture with a strong emphasis on AI integration and data persistence.

-   **Frontend (Client-side):** Developed with React 18 and TypeScript, providing a dynamic and responsive user interface. UI components are built using Shadcn/ui and styled with Tailwind CSS. React Router DOM handles client-side navigation, and state management is primarily handled by React Context API and TanStack Query for data fetching and caching.
-   **Backend (Serverless/BaaS):** Supabase serves as the backend-as-a-service, offering:
    -   **Authentication:** Secure user registration, login, and session management.
    -   **Database:** A PostgreSQL database for storing all application data (user profiles, food logs, exercise logs).
    -   **Real-time:** Capabilities for real-time data synchronization (though not heavily utilized in current features, it's available).
    -   **Edge Functions:** Potential for server-side logic (not explicitly used for core features currently).
-   **AI Integration:** Google Gemini AI (gemini-1.5-flash) is integrated to provide intelligent features:
    -   **Food Analysis:** Natural language processing to extract nutritional data from user-provided food descriptions.
    -   **Exercise Analysis:** Calculation of calories burned based on exercise descriptions, duration, and user-specific data.
-   **Database Schema:** A well-defined PostgreSQL schema ensures data integrity and efficient retrieval, with Row Level Security (RLS) enforcing data privacy.

This architecture provides a scalable, secure, and maintainable foundation for the fitness tracking application.

## 🔢 Maintenance Calorie Calculation

The application calculates a user's estimated daily maintenance calories (Total Daily Energy Expenditure - TDEE) based on their Basal Metabolic Rate (BMR) and activity level. This calculation is typically performed when the user sets up their profile or updates their physical information.

The general formula used is:

**TDEE = BMR × Activity Factor**

Where:

-   **BMR (Basal Metabolic Rate):** The number of calories your body burns at rest to maintain basic physiological functions. This is commonly estimated using formulas like the Mifflin-St Jeor Equation:
    -   **For Men:** `BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5`
    -   **For Women:** `BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161`

-   **Activity Factor:** A multiplier applied to BMR based on the user's typical activity level:
    -   **Sedentary:** (little or no exercise) - BMR × 1.2
    -   **Lightly Active:** (light exercise/sports 1-3 days/week) - BMR × 1.375
    -   **Moderately Active:** (moderate exercise/sports 3-5 days/week) - BMR × 1.55
    -   **Very Active:** (hard exercise/sports 6-7 days a week) - BMR × 1.725
    -   **Extra Active:** (very hard exercise/physical job) - BMR × 1.9

The `daily_calorie_goal` stored in the `user_profiles` table is derived from this TDEE calculation, adjusted based on the user's specific weight management goals (e.g., calorie deficit for weight loss, surplus for weight gain).

## 🥗 Micronutrient Calculation

Micronutrient information (vitamins, minerals, etc.) is estimated by the Gemini AI based on the food descriptions you provide. When you log a meal, the AI analyzes the food items and provides an estimated breakdown of key micronutrients.

The accuracy of this calculation depends on:

-   **Specificity of the Description:** "1 cup of spinach" will yield more accurate results than "a salad."
-   **AI Model Knowledge:** The AI's knowledge base is constantly updated, but it may not have detailed information on all food items.
-   **Complex Meals:** For meals with many ingredients, the AI provides a best-effort aggregated estimate.

This information is intended for general guidance and may not be 100% accurate. For precise dietary analysis, consult a registered dietitian or use a dedicated food tracking app with a verified food database.

## 🔐 Authentication & Security

- **Supabase Auth**: Handles user registration, login, and session management
- **Row Level Security**: Users can only access their own data
- **Protected Routes**: Authentication required for app features
- **Email Verification**: Users must verify email before full access
- **Secure API Keys**: Environment variables for sensitive credentials

## 📊 Database Schema

The application uses a PostgreSQL database with the following main tables:

### Users Table
Extends Supabase auth.users with profile information:
- Personal details (age, weight, height)
- Fitness goals and activity level
- Daily calorie targets

### Food Logs Table
Stores meal entries with:
- User-provided descriptions
- AI-analyzed nutritional data
- Meal type categorization
- Timestamps and metadata

### Exercise Logs Table
Tracks workouts with:
- Exercise descriptions
- AI-calculated calorie burn
- Duration and intensity
- Exercise type classification

## 🎨 UI/UX Features

- **Modern Design**: Clean, responsive interface using Tailwind CSS
- **Dark/Light Mode**: Automatic theme detection
- **Loading States**: Smooth loading indicators during AI processing
- **Error Handling**: User-friendly error messages and fallbacks
- **Toast Notifications**: Real-time feedback for user actions
- **Mobile Responsive**: Optimized for all screen sizes

## 📈 Performance Optimizations

- **Lazy Loading**: Components loaded on demand
- **Query Caching**: TanStack Query for efficient data fetching
- **Optimistic Updates**: Immediate UI feedback
- **Image Optimization**: Efficient asset loading
- **Bundle Splitting**: Reduced initial load times

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Code Quality

- **TypeScript**: Full type safety throughout the application
- **ESLint**: Code linting with React and TypeScript rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality assurance

## 🚀 Deployment

The application can be deployed to various platforms:

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify
1. Build the project: `npm run build`
2. Deploy the `dist` folder to Netlify
3. Configure environment variables

### Other Platforms
The app builds to static files and can be deployed anywhere that serves static content.

## 🔧 Configuration Options

### Customizing AI Prompts
Modify the prompts in `src/lib/gemini.ts` to adjust AI behavior:
- Food analysis accuracy
- Exercise calculation methods
- Response format and detail level

### Database Customization
Extend the schema in `database-schema.sql`:
- Add custom fields to user profiles
- Create additional logging tables
- Implement custom analytics views

## 🐛 Troubleshooting

### Common Issues

1. **AI Analysis Fails**
   - Check Gemini API key is valid
   - Verify network connectivity
   - Review API quota limits

2. **Database Connection Issues**
   - Confirm Supabase URL and keys
   - Check RLS policies are correctly set
   - Verify table permissions

3. **Authentication Problems**
   - Ensure email verification is complete
   - Check Supabase Auth settings
   - Verify redirect URLs are configured

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Supabase** for the excellent backend-as-a-service platform
- **Google AI** for the powerful Gemini language model
- **Shadcn/ui** for the beautiful component library
- **Vercel** for the seamless deployment platform

---

## 🚀 Getting Started Checklist

- [ ] Clone repository and install dependencies
- [ ] Set up Supabase project and get credentials
- [ ] Get Google AI Studio API key
- [ ] Configure environment variables
- [ ] Run database schema setup
- [ ] Start development server
- [ ] Create test account and explore features

Ready to start tracking your fitness journey with AI! 🏃‍♂️💪