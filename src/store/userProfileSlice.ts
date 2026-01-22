"use client";

import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  taxId?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  crmv?: string;
  crmvState?: string;
  mapaRegistration?: string;
  operateHow?: string;
  expertise?: string[];
  acceptTerms?: boolean;
  profileType?: "Veterinarian" | "Guardian";
  role?: "Veterinarian" | "Guardian";
  clinicLogoUrl?: string;
  tradeName?: string;
  cnpjIe?: string;
  reportHeaderAddress?: string;
  reportFooter?: string;
  profileImageUrl?: string;
  preferredLanguage?: "en" | "pt";
  baseExamPrice?: number;
  notificationSettings?: Record<string, any>;
  payoutMethod?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
};

type UserProfileState = {
  profile: UserProfile | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const initialState: UserProfileState = {
  profile: null,
  status: "idle",
  error: null,
};

export const fetchMe = createAsyncThunk<UserProfile, void, { rejectValue: string }>(
  "userProfile/fetchMe",
  async (_, { rejectWithValue }) => {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return rejectWithValue(typeof data?.error === "string" ? data.error : "Failed to load profile");
    }
    const profile = data?.profile;
    if (!profile || typeof profile !== "object") {
      return rejectWithValue("Invalid profile response");
    }
    return profile as UserProfile;
  }
);

const userProfileSlice = createSlice({
  name: "userProfile",
  initialState,
  reducers: {
    setProfile(state, action: PayloadAction<UserProfile | null>) {
      state.profile = action.payload;
      state.error = null;
      state.status = "succeeded";
    },
    clearProfile(state) {
      state.profile = null;
      state.error = null;
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load profile";
        state.profile = null;
      });
  },
});

export const { setProfile, clearProfile } = userProfileSlice.actions;
export default userProfileSlice.reducer;
