import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserByEmail, verifyPassword, getUserById, initDB } from '@/lib/db';

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: 'user' | 'admin';
  testimonialAllowed: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'sb_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize database and restore session
  useEffect(() => {
    async function initialize() {
      try {
        await initDB();
        // Restore session from localStorage
        const savedUser = localStorage.getItem(STORAGE_KEY);
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            // Verify user still exists in database
            const dbUser = await getUserById(parsed.id);
            if (dbUser) {
              setUser({
                id: dbUser.id,
                fullName: dbUser.fullName,
                email: dbUser.email,
                role: dbUser.role,
                testimonialAllowed: dbUser.testimonialAllowed,
              });
            } else {
              // User deleted from DB, clear session
              localStorage.removeItem(STORAGE_KEY);
            }
          } catch (e) {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    }
    initialize();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const dbUser = await getUserByEmail(email.toLowerCase());
      if (!dbUser) {
        return { success: false, message: 'Invalid email or password' };
      }

      // Check if user is suspended
      if (dbUser.isSuspended) {
        return { success: false, message: 'Account suspended. Please contact admin.' };
      }

      const isValid = await verifyPassword(password, dbUser.password);
      if (!isValid) {
        return { success: false, message: 'Invalid email or password' };
      }

      const authUser: AuthUser = {
        id: dbUser.id,
        fullName: dbUser.fullName,
        email: dbUser.email,
        role: dbUser.role,
        testimonialAllowed: dbUser.testimonialAllowed,
      };

      setUser(authUser);
      // Persist session in localStorage (no expiration for persistent sessions)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An error occurred during login' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Update user data when it changes (e.g., testimonial permission)
  const updateUserData = async () => {
    if (user) {
      const dbUser = await getUserById(user.id);
      if (dbUser) {
        const updatedUser: AuthUser = {
          id: dbUser.id,
          fullName: dbUser.fullName,
          email: dbUser.email,
          role: dbUser.role,
          testimonialAllowed: dbUser.testimonialAllowed,
        };
        setUser(updatedUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      }
    }
  };

  // Expose update function via context (for refreshing user data)
  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    refreshUser: updateUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper function to get first name from full name
export function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}
