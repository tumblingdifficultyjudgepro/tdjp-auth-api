import React, { createContext, useContext, useState, ReactNode } from 'react';

type User = {
  name: string;
  level: number;
};

type AuthContextType = {
  user: User | null;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Default to null (Guest) for initial state, or mock user for dev
  const [user, setUser] = useState<User | null>(null);

  const login = () => {
    setUser({
      name: "Liam",
      level: 5
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
