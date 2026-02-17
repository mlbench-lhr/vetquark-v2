import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AdminProfile = {
  id: string;
  fullName: string;
  email: string;
  role: "Admin";
  avatar?: string | null;
};

type AdminAuthState = {
  profile: AdminProfile | null;
};

const initialState: AdminAuthState = {
  profile: null,
};

const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState,
  reducers: {
    setAdminProfile(state, action: PayloadAction<AdminProfile | null>) {
      state.profile = action.payload;
    },
    clearAdminProfile(state) {
      state.profile = null;
    },
  },
});

export const { setAdminProfile, clearAdminProfile } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;
