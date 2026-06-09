'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type staff = {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  roleType?: string;
  firmId?: string;
};

type AuthContextType = {
  isLoggedIn: boolean;
  staff: staff | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [staff, setstaff] = useState<staff | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('wa_crm_token');
    const storedstaff = localStorage.getItem('wa_crm_staff');
    if (token && storedstaff) {
      setIsLoggedIn(true);
      setstaff(JSON.parse(storedstaff));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Login failed' };

      localStorage.setItem('wa_crm_token', data.token);
      localStorage.setItem('wa_crm_staff', JSON.stringify(data.data));
      setIsLoggedIn(true);
      setstaff(data.data);
      return { success: true };
    } catch {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('wa_crm_token');
    localStorage.removeItem('wa_crm_staff');
    setIsLoggedIn(false);
    setstaff(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, staff, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
