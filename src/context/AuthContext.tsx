import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, UserProfile, getStoredToken, removeStoredToken } from '../services/api';
import { BusinessDetails } from '../types/invoice';
import { useToast } from '../components/Toast';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (fullName: string, email: string, password: string, confirmPassword?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateBusinessProfile: (profile: BusinessDetails) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = getStoredToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await api.auth.getMe();
        setUser(data.user);
      } catch (err) {
        console.warn('Session expired or invalid, clearing token.');
        removeStoredToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.auth.login(email, password);
      setUser(res.user);
      showToast(`Welcome back, ${res.user.fullName}!`, 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Login failed. Please check your credentials.', 'error');
      return false;
    }
  }, [showToast]);

  const register = useCallback(async (fullName: string, email: string, password: string, confirmPassword?: string): Promise<boolean> => {
    try {
      const res = await api.auth.register(fullName, email, password, confirmPassword);
      setUser(res.user);
      showToast(`Account created! Welcome, ${res.user.fullName}.`, 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Registration failed. Please check your details.', 'error');
      return false;
    }
  }, [showToast]);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      showToast('You have been signed out safely.', 'info');
    }
  }, [showToast]);

  const updateBusinessProfile = useCallback(async (profile: BusinessDetails): Promise<boolean> => {
    try {
      await api.profile.saveBusiness(profile);
      if (user) {
        setUser({
          ...user,
          businessProfile: profile,
        });
      }
      showToast('Business profile updated successfully!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to save business profile.', 'error');
      return false;
    }
  }, [user, showToast]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateBusinessProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
