import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';

const ConfigCheck: React.FC = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const isApiConfigured =
    Boolean(apiBaseUrl) &&
    !String(apiBaseUrl).includes("your-backend-url") &&
    !String(apiBaseUrl).includes("your-api");

  const isGeminiConfigured = geminiApiKey && 
    !geminiApiKey.includes('your-gemini-api-key');

  if (isApiConfigured && isGeminiConfigured) {
    return null; // Don't show anything if everything is configured
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      {!isApiConfigured && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Backend API Configuration Missing</AlertTitle>
          <AlertDescription className="text-sm">
            Please set <code>VITE_API_BASE_URL</code> in your frontend <code>.env</code>.
            <br />
            <span className="text-xs">Example: http://localhost:3000</span>
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