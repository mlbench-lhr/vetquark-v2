"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { fetchMe, setProfile, type UserProfile } from "./userProfileSlice";

const STORAGE_KEY = "user_profile_v1";

function safeParseProfile(value: string | null): UserProfile | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.id !== "string" || typeof parsed.email !== "string") return null;
    if (typeof parsed.fullName !== "string") return null;
    return parsed as UserProfile;
  } catch {
    return null;
  }
}

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  const hydratedRef = useRef(false);
  const persistedProfile = useMemo(() => {
    if (typeof window === "undefined") return null;
    return safeParseProfile(window.localStorage.getItem(STORAGE_KEY));
  }, []);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    if (persistedProfile) {
      store.dispatch(setProfile(persistedProfile));
    }

    store.dispatch(fetchMe()).finally(() => {
      const state = store.getState();
      const profile = state.userProfile.profile;
      if (!profile) {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      }
    });

    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      const profile = state.userProfile.profile;
      if (!profile) {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      }
    });

    return unsubscribe;
  }, [persistedProfile]);

  return <Provider store={store}>{children}</Provider>;
}

