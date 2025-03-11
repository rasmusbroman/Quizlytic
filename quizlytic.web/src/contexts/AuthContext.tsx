"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";

export enum UserRole {
  User = "user",
  Admin = "admin",
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (
    name: string,
    username: string,
    password: string
  ) => Promise<boolean>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  register: async () => false,
  logout: () => {},
  error: null,
  clearError: () => {},
});

const INITIAL_USERS: User[] = [
  {
    id: "1",
    username: "admin",
    name: "Administrator",
    role: UserRole.Admin,
  },
];

const INITIAL_CREDENTIALS: Record<string, string> = {
  admin: "1234",
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Initializing AuthProvider");

    const storedUsers = localStorage.getItem("quizlytic_users");
    if (storedUsers) {
      try {
        const parsedUsers = JSON.parse(storedUsers);
        console.log("Loaded users from localStorage:", parsedUsers);
        setUsers(parsedUsers);
      } catch (e) {
        console.error("Error parsing stored users:", e);
        setUsers(INITIAL_USERS);
        localStorage.setItem("quizlytic_users", JSON.stringify(INITIAL_USERS));
      }
    } else {
      console.log("No stored users, using initial:", INITIAL_USERS);
      setUsers(INITIAL_USERS);
      localStorage.setItem("quizlytic_users", JSON.stringify(INITIAL_USERS));
    }

    const storedCredentials = localStorage.getItem("quizlytic_credentials");
    if (storedCredentials) {
      try {
        setCredentials(JSON.parse(storedCredentials));
      } catch (e) {
        console.error("Error parsing stored credentials:", e);
        setCredentials(INITIAL_CREDENTIALS);
        localStorage.setItem(
          "quizlytic_credentials",
          JSON.stringify(INITIAL_CREDENTIALS)
        );
      }
    } else {
      setCredentials(INITIAL_CREDENTIALS);
      localStorage.setItem(
        "quizlytic_credentials",
        JSON.stringify(INITIAL_CREDENTIALS)
      );
    }

    const storedUser = localStorage.getItem("quizlytic_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("Loaded user session:", parsedUser);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem("quizlytic_user");
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    setError(null);
    console.log("Logging in as:", username);

    if (!credentials[username] || credentials[username] !== password) {
      setError("Invalid username or password");
      return false;
    }

    const foundUser = users.find((u) => u.username === username);
    if (!foundUser) {
      setError("User not found");
      return false;
    }

    console.log("User found, role:", foundUser.role);

    if (username === "admin" && foundUser.role !== UserRole.Admin) {
      console.log("Correcting admin role");
      foundUser.role = UserRole.Admin;

      const updatedUsers = users.map((u) =>
        u.username === "admin" ? { ...u, role: UserRole.Admin } : u
      );
      setUsers(updatedUsers);
      localStorage.setItem("quizlytic_users", JSON.stringify(updatedUsers));
    }

    setUser(foundUser);
    localStorage.setItem("quizlytic_user", JSON.stringify(foundUser));
    return true;
  };

  const register = async (
    name: string,
    username: string,
    password: string
  ): Promise<boolean> => {
    setError(null);

    if (credentials[username]) {
      setError("Username already exists");
      return false;
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      username,
      name,
      role: UserRole.User,
    };

    const updatedUsers = [...users, newUser];
    const updatedCredentials = { ...credentials, [username]: password };
    setUsers(updatedUsers);
    setCredentials(updatedCredentials);
    localStorage.setItem("quizlytic_users", JSON.stringify(updatedUsers));
    localStorage.setItem(
      "quizlytic_credentials",
      JSON.stringify(updatedCredentials)
    );
    setUser(newUser);
    localStorage.setItem("quizlytic_user", JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("quizlytic_user");
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
