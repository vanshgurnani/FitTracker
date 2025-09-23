import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle } from 'lucide-react';

const ConfigCheck: React.FC = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const isSupabaseConfigured = supabaseUrl && 
    supabaseAnonKey && 
    !supabaseUrl.includes('your-project') && 
    !supabaseAnonKey.includes('your-anon-key');

  const isGeminiConfigured = geminiApiKey && 
    !geminiApiKey.includes('your-gemini-api-key');

  if (isSupabaseConfigured && isGeminiConfigured) {
    return null; // Don't show anything if everything is configured
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      {!isSupabaseConfigured && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Supabase Configuration Missing</AlertTitle>
          <AlertDescription className="text-sm">
            Please update your .env file with actual Supabase credentials.
            <br />
            <span className="text-xs">Get them from: supabase.com/dashboard</span>
          </AlertDescription>
        </Alert>
      )}
      
      {!isGeminiConfigured && (
        <Alert variant="default" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Gemini API Configuration Missing</AlertTitle>
          <AlertDescription className="text-sm">
            AI features won't work without a Gemini API key.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ConfigCheck;