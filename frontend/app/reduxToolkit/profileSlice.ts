import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";

// Type definitions
interface ProfileUser {
    id: string;
    username: string;
    email: string;
    profilePicture: string | null;
    preferredGenres?: string[];
    preferredAuthors?: string[];
    hasCompletedOnboarding?: boolean;
    isRenter: boolean;
    rentalStatus: 'inactive' | 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

interface ProfileStatistics {
    memberSince: string;
    booksBorrowed: number;
    booksLent: number;
    totalEarnings: number;
}

interface ProfileState {
    user: ProfileUser | null;
    statistics: ProfileStatistics | null;
    sections: {
        basicInfo: { loading: boolean; error: string | null; isDirty: boolean };
        password: { loading: boolean; error: string | null };
        profilePicture: { loading: boolean; error: string | null };
        renterServices: { loading: boolean; error: string | null };
        stats: { loading: boolean; error: string | null };
    };
}

interface ApiErrorPayload {
    message?: string;
}

const initialState: ProfileState = {
    user: null,
    statistics: null,
    sections: {
        basicInfo: { loading: false, error: null, isDirty: false },
        password: { loading: false, error: null },
        profilePicture: { loading: false, error: null },
        renterServices: { loading: false, error: null },
        stats: { loading: false, error: null },
    },
};

// API Base URL
const API_BASE = 'http://localhost:5000/api';

// Async Thunks
export const fetchProfileData = createAsyncThunk(
    'profile/fetchData',
    async (token: string, { rejectWithValue }) => {
        try {
            const profileRes = await axios.get(`${API_BASE}/users/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const statsRes = await axios.get(`${API_BASE}/users/profile/statistics`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return {
                user: profileRes.data.user,
                statistics: statsRes.data.statistics
            };
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorPayload>;
            return rejectWithValue(axiosError.response?.data?.message || "Failed to fetch profile");
        }
    }
);

export const updateBasicInfo = createAsyncThunk(
    'profile/updateBasicInfo',
    async (
        { data, token }: { data: { username?: string; email?: string }; token: string },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.put(`${API_BASE}/users/profile`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data.user;
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorPayload>;
            return rejectWithValue(axiosError.response?.data?.message || "Failed to update profile");
        }
    }
);

export const completeOnboarding = createAsyncThunk(
    'profile/completeOnboarding',
    async (
        {
            data,
            token
        }: {
            data: { preferredGenres: string[]; preferredAuthors: string[]; hasCompletedOnboarding: boolean };
            token: string;
        },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.put(`${API_BASE}/users/profile`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data.user;
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorPayload>;
            return rejectWithValue(axiosError.response?.data?.message || "Failed to save onboarding preferences");
        }
    }
);

export const uploadProfilePicture = createAsyncThunk(
    'profile/uploadPicture',
    async (
        { formData, token }: { formData: FormData; token: string },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.post(`${API_BASE}/users/profile/picture`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data.user;
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorPayload>;
            return rejectWithValue(axiosError.response?.data?.message || "Failed to upload picture");
        }
    }
);

export const deleteProfilePicture = createAsyncThunk(
    'profile/deletePicture',
    async (token: string, { rejectWithValue }) => {
        try {
            const response = await axios.delete(`${API_BASE}/users/profile/picture`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data.user;
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorPayload>;
            return rejectWithValue(axiosError.response?.data?.message || "Failed to delete picture");
        }
    }
);

export const changePassword = createAsyncThunk(
    'profile/changePassword',
    async (
        {
            data,
            token
        }: {
            data: { currentPassword: string; newPassword: string; confirmPassword: string };
            token: string;
        },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.post(`${API_BASE}/users/profile/password-change`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorPayload>;
            return rejectWithValue(axiosError.response?.data?.message || "Failed to change password");
        }
    }
);

export const enableRenterServices = createAsyncThunk(
    'profile/enableRenter',
    async (token: string, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_BASE}/users/profile/enable-renter`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data.user;
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorPayload>;
            return rejectWithValue(axiosError.response?.data?.message || "Failed to update renter status");
        }
    }
);

// Create slice
const profileSlice = createSlice({
    name: 'profile',
    initialState,
    reducers: {
        markSectionDirty: (state, action: PayloadAction<keyof typeof state.sections>) => {
            if (action.payload === 'basicInfo') {
                state.sections.basicInfo.isDirty = true;
            }
        },
        markSectionClean: (state, action: PayloadAction<keyof typeof state.sections>) => {
            if (action.payload === 'basicInfo') {
                state.sections.basicInfo.isDirty = false;
            }
        },
        clearSectionError: (state, action: PayloadAction<keyof typeof state.sections>) => {
            state.sections[action.payload].error = null;
        },
        resetProfileState: (state) => {
            state.user = null;
            state.statistics = null;
            state.sections = initialState.sections;
        },
    },
    extraReducers: (builder) => {
        // Fetch Profile Data
        builder
            .addCase(fetchProfileData.pending, (state) => {
                state.sections.stats.loading = true;
                state.sections.stats.error = null;
            })
            .addCase(fetchProfileData.fulfilled, (state, action) => {
                state.sections.stats.loading = false;
                state.user = action.payload.user;
                state.statistics = action.payload.statistics;
            })
            .addCase(fetchProfileData.rejected, (state, action) => {
                state.sections.stats.loading = false;
                state.sections.stats.error = action.payload as string;
            });

        // Update Basic Info
        builder
            .addCase(updateBasicInfo.pending, (state) => {
                state.sections.basicInfo.loading = true;
                state.sections.basicInfo.error = null;
            })
            .addCase(updateBasicInfo.fulfilled, (state, action) => {
                state.sections.basicInfo.loading = false;
                state.sections.basicInfo.isDirty = false;
                state.user = action.payload;
            })
            .addCase(updateBasicInfo.rejected, (state, action) => {
                state.sections.basicInfo.loading = false;
                state.sections.basicInfo.error = action.payload as string;
            });

        builder
            .addCase(completeOnboarding.pending, (state) => {
                state.sections.basicInfo.loading = true;
                state.sections.basicInfo.error = null;
            })
            .addCase(completeOnboarding.fulfilled, (state, action) => {
                state.sections.basicInfo.loading = false;
                state.user = action.payload;
            })
            .addCase(completeOnboarding.rejected, (state, action) => {
                state.sections.basicInfo.loading = false;
                state.sections.basicInfo.error = action.payload as string;
            });

        // Upload Picture
        builder
            .addCase(uploadProfilePicture.pending, (state) => {
                state.sections.profilePicture.loading = true;
                state.sections.profilePicture.error = null;
            })
            .addCase(uploadProfilePicture.fulfilled, (state, action) => {
                state.sections.profilePicture.loading = false;
                state.user = action.payload;
            })
            .addCase(uploadProfilePicture.rejected, (state, action) => {
                state.sections.profilePicture.loading = false;
                state.sections.profilePicture.error = action.payload as string;
            });

        // Delete Picture
        builder
            .addCase(deleteProfilePicture.pending, (state) => {
                state.sections.profilePicture.loading = true;
                state.sections.profilePicture.error = null;
            })
            .addCase(deleteProfilePicture.fulfilled, (state, action) => {
                state.sections.profilePicture.loading = false;
                state.user = action.payload;
            })
            .addCase(deleteProfilePicture.rejected, (state, action) => {
                state.sections.profilePicture.loading = false;
                state.sections.profilePicture.error = action.payload as string;
            });

        // Change Password
        builder
            .addCase(changePassword.pending, (state) => {
                state.sections.password.loading = true;
                state.sections.password.error = null;
            })
            .addCase(changePassword.fulfilled, (state) => {
                state.sections.password.loading = false;
            })
            .addCase(changePassword.rejected, (state, action) => {
                state.sections.password.loading = false;
                state.sections.password.error = action.payload as string;
            });

        // Enable Renter Services
        builder
            .addCase(enableRenterServices.pending, (state) => {
                state.sections.renterServices.loading = true;
                state.sections.renterServices.error = null;
            })
            .addCase(enableRenterServices.fulfilled, (state, action) => {
                state.sections.renterServices.loading = false;
                state.user = action.payload;
            })
            .addCase(enableRenterServices.rejected, (state, action) => {
                state.sections.renterServices.loading = false;
                state.sections.renterServices.error = action.payload as string;
            });
    },
});

export const { markSectionDirty, markSectionClean, clearSectionError, resetProfileState } = profileSlice.actions;
export default profileSlice.reducer;
