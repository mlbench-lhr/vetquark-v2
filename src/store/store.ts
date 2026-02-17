"use client";

import { configureStore } from "@reduxjs/toolkit";
import userProfileReducer from "./userProfileSlice";
import sidebarReducer from "./sidebarSlice";
import adminAuthReducer from "./adminAuthSlice";

export const store = configureStore({
  reducer: {
    userProfile: userProfileReducer,
    sidebar: sidebarReducer,
    adminAuth: adminAuthReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
