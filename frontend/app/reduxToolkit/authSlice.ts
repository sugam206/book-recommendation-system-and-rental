import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";

export enum Role {
    USER = 'user',
    ADMIN = 'admin'
}

interface User {
    id: string;
    username: string;
    email: string;
    role: Role;
    hasCompletedOnboarding?: boolean;
}

interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
}

interface AuthSuccessPayload {
    user: User;
    token: string;
}

interface ApiErrorPayload {
    message?: string;
}


const loadInitialState = (): AuthState => {

    if (typeof window === "undefined") {
        return { user: null, token: null, loading: false, error: null };
    }
    // Browser: safely read from localStorage
    try {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        const user: User | null = userStr ? JSON.parse(userStr) : null;
        return { user, token, loading: false, error: null };
    } catch (error) {
        console.error("Error loading auth state from localStorage:", error);
        return { user: null, token: null, loading: false, error: null };
    }
};

const initialState: AuthState = loadInitialState();

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const registerUser = createAsyncThunk(
    "auth/register",
    async (data: { username: string; email: string; password: string; confirmPassword: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post('http://localhost:5000/api/auth/register', data);
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorPayload>;
            return rejectWithValue(axiosError.response?.data?.message || "Register failed");
        }
    }
);

export const loginUser = createAsyncThunk(
    "auth/login",
    async (data: { email: string; password: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', data);
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorPayload>;
            return rejectWithValue(axiosError.response?.data?.message || "Login failed");
        }
    }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            if (typeof window !== "undefined") {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
            }
        },

        loadUserFromStorage: (state) => {
            if (typeof window === "undefined") return;
            const token = localStorage.getItem("token");
            const userStr = localStorage.getItem("user");
            if (token && userStr) {
                state.token = token;
                state.user = JSON.parse(userStr);
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Register
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action: PayloadAction<AuthSuccessPayload>) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                if (typeof window !== "undefined") {
                    localStorage.setItem("token", action.payload.token);
                    localStorage.setItem("user", JSON.stringify(action.payload.user)); // FIX: was missing
                }
            })
            .addCase(registerUser.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.loading = false;
                state.error = action.payload || "Register failed";
            })

            // Login
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action: PayloadAction<AuthSuccessPayload>) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                if (typeof window !== "undefined") {
                    localStorage.setItem("token", action.payload.token);
                    localStorage.setItem("user", JSON.stringify(action.payload.user));
                }
            })
            .addCase(loginUser.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.loading = false;
                state.error = action.payload || "Login failed";
            });
    },
});

export const { logout, loadUserFromStorage } = authSlice.actions;
export default authSlice.reducer;
