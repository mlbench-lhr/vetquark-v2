"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { isAppLanguage, type AppLanguage } from "./i18n";
import { useAppSelector } from "@/store/hooks";

const STORAGE_KEY = "ui_language_v1";

function getNavigatorLanguage(): AppLanguage {
  if (typeof window === "undefined") return "en";
  const langs = Array.isArray(navigator.languages) ? navigator.languages : [];
  const all = [navigator.language, ...langs].filter(Boolean);
  for (const raw of all) {
    const lower = String(raw).toLowerCase();
    if (lower.startsWith("pt")) return "pt";
    if (lower.startsWith("en")) return "en";
  }
  return "en";
}

function readPersistedLanguage(): AppLanguage | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return isAppLanguage(v) ? v : null;
}

function persistLanguage(lang: AppLanguage) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, lang);
}

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const profileLanguage = useAppSelector((s) => s.userProfile.profile?.preferredLanguage);
  const initialLanguage = useMemo<AppLanguage>(() => {
    const persisted = readPersistedLanguage();
    if (persisted) return persisted;
    if (profileLanguage && isAppLanguage(profileLanguage)) return profileLanguage;
    return "pt";
  }, [profileLanguage]);

  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    if (i18n.language !== initialLanguage) i18n.changeLanguage(initialLanguage);
    persistLanguage(initialLanguage);
  }, [initialLanguage]);

  useEffect(() => {
    if (!profileLanguage || !isAppLanguage(profileLanguage)) return;
    if (i18n.language === profileLanguage) return;
    i18n.changeLanguage(profileLanguage);
    persistLanguage(profileLanguage);
  }, [profileLanguage]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
