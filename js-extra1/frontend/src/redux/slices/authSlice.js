import { createSlice } from "@reduxjs/toolkit";

const normalizeRole = (role) => (role === "student" ? "jobseeker" : role);

const normalizeUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    role: normalizeRole(user.role)
  };
};

const normalizeAuthState = (state) => {
  if (!state) return null;
  return {
    ...state,
    user: normalizeUser(state.user)
  };
};

const readAuth = () => {
  try {
    const stored = localStorage.getItem("career_auth");
    return stored ? normalizeAuthState(JSON.parse(stored)) : null;
  } catch {
    return null;
  }
};

const persistAuth = (state) => {
  localStorage.setItem("career_auth", JSON.stringify(state));
  localStorage.setItem("career_auth_token", state.token || "");
};

const persisted = readAuth();

const initialState = persisted || {
  isAuthenticated: false,
  token: null,
  user: null
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const normalized = normalizeAuthState(action.payload);
      state.isAuthenticated = true;
      state.token = normalized.token;
      state.user = normalized.user;
      persistAuth(state);
    },
    setUser: (state, action) => {
      state.user = normalizeUser(action.payload);
      if (!state.token) state.isAuthenticated = false;
      persistAuth(state);
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      localStorage.removeItem("career_auth");
      localStorage.removeItem("career_auth_token");
    }
  }
});

export const { setCredentials, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
