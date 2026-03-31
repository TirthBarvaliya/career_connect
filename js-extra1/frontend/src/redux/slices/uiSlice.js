import { createSlice } from "@reduxjs/toolkit";

const getTheme = () => localStorage.getItem("career_theme") || "light";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    theme: getTheme(),
    toasts: [],
    notifications: [],
    sidebarOpen: false
  },
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem("career_theme", state.theme);
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem("career_theme", state.theme);
    },
    addToast: (state, action) => {
      state.toasts.push({
        id: `toast-${Date.now()}`,
        type: action.payload.type || "info",
        message: action.payload.message
      });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
    dismissNotification: (state, action) => {
      state.notifications = state.notifications.filter((notification) => notification.id !== action.payload);
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    }
  }
});

export const {
  toggleTheme,
  setTheme,
  addToast,
  removeToast,
  dismissNotification,
  setSidebarOpen
} = uiSlice.actions;
export default uiSlice.reducer;
