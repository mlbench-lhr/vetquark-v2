import { createSlice } from "@reduxjs/toolkit";

type SidebarState = {
  isOpen: boolean;
  isCollapsed: boolean;
};

const initialState: SidebarState = {
  isOpen: false,
  isCollapsed: false,
};

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    toggleCollapse(state) {
      state.isCollapsed = !state.isCollapsed;
    },
    toggleSidebar(state) {
      state.isOpen = !state.isOpen;
    },
    closeSidebar(state) {
      state.isOpen = false;
    },
  },
});

export const { toggleCollapse, toggleSidebar, closeSidebar } = sidebarSlice.actions;
export default sidebarSlice.reducer;
