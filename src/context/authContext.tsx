"use client";
import React, { createContext, useState, useEffect, ReactNode } from "react";
import Cookies from "js-cookie";
import { usePathname, useRouter } from "next/navigation";
import { buildRequestBody } from "@/utils/apiWrapper";
import { store } from "@/store/store";
import { clearProfile } from "@/store/userProfileSlice";

// Types
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_image_url: string;
  notification_setting: boolean;
}

interface UserContextType {
  user: User | null;
  session_id: string;
  setUser: (user: User | null) => void;
  login: (session_id: string) => void;
  logout: () => void;
  loading: boolean;
}

interface UserProviderProps {
  children: ReactNode;
}

// Context
export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  session_id: "",
  login: () => {},
  logout: () => {},
  loading: true,
});

// Provider
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [session_id, setSession_id] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const pathname = usePathname();
  const router = useRouter();
  const payload = buildRequestBody({});

  const fetchUser = async (sessionId: string) => {
    try {
      const response = await fetch("/api/auth/fetch_user", {
        method: "POST",
        headers: {
          "Session": sessionId, 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if ([401, 403].includes(response.status)) {
          setUser(null);
          Cookies.remove("session_id");
          localStorage.removeItem("session_id");
          setSession_id("");
        }
        throw new Error("Failed to fetch Admin");
      }

      const data = await response.json();
      setUser(data.data.data);
    } catch (err) {
      console.error("User fetch failed:", err);
      // Clear invalid session
      setUser(null);
      Cookies.remove("session_id");
      localStorage.removeItem("session_id");
      setSession_id("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedSession = localStorage.getItem("session_id") || Cookies.get("session_id");
    
    if (savedSession?.trim()) {
      setSession_id(savedSession);
      setLoading(true);
      fetchUser(savedSession);
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [pathname]);

  const login = (sessionId: string) => {
    Cookies.set("session_id", sessionId); 
    localStorage.setItem("session_id", sessionId);
    setSession_id(sessionId);
    
    fetchUser(sessionId);
    
    console.log("login", sessionId);
  };

  const logout = () => {
    Cookies.remove("session_id");
    localStorage.removeItem("session_id");
    localStorage.removeItem("user_profile_v1");
    store.dispatch(clearProfile());
    setSession_id("");
    setUser(null);
    router.push("/signin");
  };

  return (
    <UserContext.Provider value={{ user, setUser, session_id, login, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};
