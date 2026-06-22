import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  createUser: (data: Omit<User, 'id'> & { password: string }) => boolean;
  updateUser: (id: string, data: Partial<Omit<User, 'id'>>) => boolean;
  updatePassword: (id: string, oldPassword: string, newPassword: string) => boolean;
  users: User[];
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'garra_auth_users';
const SESSION_KEY = 'garra_auth_session';

const DEFAULT_USERS: User[] = [
  { id: '1', username: 'marcelo', fullName: 'Marcelo Gomez', email: 'marcelo@garra.com', role: 'admin' },
];

function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return DEFAULT_USERS;
}

function getStoredPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY + '_passwords');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { '1': '123456' };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(getStoredUsers);
  const [passwords, setPasswords] = useState<Record<string, string>>(getStoredPasswords);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const sessionUser = JSON.parse(raw) as User;
        setUser(sessionUser);
      }
    } catch { /* ignore */ }
    setInitialized(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_passwords', JSON.stringify(passwords));
  }, [passwords]);

  const login = (username: string, password: string): boolean => {
    const found = users.find(u => u.username === username);
    if (!found) return false;
    const storedPassword = passwords[found.id];
    if (storedPassword !== password) return false;
    setUser(found);
    localStorage.setItem(SESSION_KEY, JSON.stringify(found));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const createUser = (data: Omit<User, 'id'> & { password: string }): boolean => {
    if (users.some(u => u.username === data.username)) return false;
    const id = crypto.randomUUID();
    const newUser: User = {
      id,
      username: data.username,
      fullName: data.fullName,
      email: data.email,
      role: 'admin',
    };
    setUsers(prev => [...prev, newUser]);
    setPasswords(prev => ({ ...prev, [id]: data.password }));
    return true;
  };

  const updateUser = (id: string, data: Partial<Omit<User, 'id'>>): boolean => {
    setUsers(prev => {
      const updated = prev.map(u => u.id === id ? { ...u, ...data } : u);
      const current = updated.find(u => u.id === id);
      if (current && user?.id === id) {
        setUser(current);
        localStorage.setItem(SESSION_KEY, JSON.stringify(current));
      }
      return updated;
    });
    return true;
  };

  const updatePassword = (id: string, oldPassword: string, newPassword: string): boolean => {
    const currentPassword = passwords[id];
    if (currentPassword !== oldPassword) return false;
    setPasswords(prev => ({ ...prev, [id]: newPassword }));
    return true;
  };

  if (!initialized) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout, createUser, updateUser, updatePassword, users }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
