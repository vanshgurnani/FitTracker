import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { UserProfile } from "@/lib/types";
import {
  clearStoredToken,
  decodeJwtPayload,
  getMyProfile,
  getStoredProfile,
  getStoredToken,
  login,
  register,
  sendOtp,
  setStoredProfile,
  setStoredToken,
  updateMyProfile,
} from "@/lib/fittrackerApi";

export interface AuthUser {
  id?: string;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  userProfile: UserProfile | null;
  token: string | null;

  sendSignupOtp: (email: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, otp: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithToken: (token: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const storedToken = getStoredToken();
    const storedProfile = getStoredProfile();

    if (storedToken) {
      setToken(storedToken);
      const decoded = decodeJwtPayload(storedToken);
      setUser(decoded.id || decoded.email ? decoded : null);
    }

    if (storedProfile) {
      setUserProfile(storedProfile);
    }
  }, []);

  const refreshProfile = async () => {
    const currentToken = token ?? getStoredToken();
    if (!currentToken) return;
    const profile = await getMyProfile(currentToken);
    setUserProfile(profile);
    setStoredProfile(profile);
  };

  const signInWithToken = async (accessToken: string) => {
    try {
      setStoredToken(accessToken);
      setToken(accessToken);

      const decoded = decodeJwtPayload(accessToken);
      setUser(decoded.id || decoded.email ? decoded : null);

      const profile = await getMyProfile(accessToken);
      setUserProfile(profile);
      setStoredProfile(profile);

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const sendSignupOtp = async (email: string) => {
    try {
      await sendOtp(email, "register");
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const accessToken = await login(email, password);
      setStoredToken(accessToken);
      setToken(accessToken);

      const decoded = decodeJwtPayload(accessToken);
      setUser(decoded.id || decoded.email ? decoded : null);

      const profile = await getMyProfile(accessToken);
      setUserProfile(profile);
      setStoredProfile(profile);

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    otp: string,
    fullName?: string
  ) => {
    try {
      const accessToken = await register({ email, password, otp, fullName });
      setStoredToken(accessToken);
      setToken(accessToken);

      const decoded = decodeJwtPayload(accessToken);
      setUser(decoded.id || decoded.email ? decoded : null);

      const profile = await getMyProfile(accessToken);
      setUserProfile(profile);
      setStoredProfile(profile);

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      clearStoredToken();
      setStoredProfile(null);
      setToken(null);
      setUser(null);
      setUserProfile(null);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const currentToken = token ?? getStoredToken();
      if (!currentToken) {
        return { error: new Error("No token found") };
      }

      const profile = await updateMyProfile(currentToken, updates);
      setUserProfile(profile);
      setStoredProfile(profile);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    token,
    sendSignupOtp,
    signUp,
    signIn,
    signInWithToken,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Protected Route Component
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!token || !user) {
      navigate("/login", { replace: true });
    }
  }, [user, token, navigate]);

  if (!token || !user) {
    return null;
  }

  return <>{children}</>;
};
