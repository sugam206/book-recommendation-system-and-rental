import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

interface RentalRequest {
    _id: string;
    userId: string;
    businessName: string;
    businessDescription: string;
    experienceLevel: 'beginner' | 'intermediate' | 'expert';
    rentalTermsPreference: string;
    status: 'pending' | 'approved' | 'rejected';
    requestDate: string;
    reviewedDate?: string;
    reviewedBy?: string;
    adminNotes?: string;
}

interface RentalRequestState {
    currentRequest: RentalRequest | null;
    allRequests: RentalRequest[];
    sections: {
        submitRequest: { loading: boolean; error: string | null };
        fetchRequest: { loading: boolean; error: string | null };
        adminApprove: { loading: boolean; error: string | null };
        adminReject: { loading: boolean; error: string | null };
        adminList: { loading: boolean; error: string | null };
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

const initialState: RentalRequestState = {
    currentRequest: null,
    allRequests: [],
    sections: {
        submitRequest: { loading: false, error: null },
        fetchRequest: { loading: false, error: null },
        adminApprove: { loading: false, error: null },
        adminReject: { loading: false, error: null },
        adminList: { loading: false, error: null }
    },
    pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    }
};

const API_BASE = 'http://localhost:5000/api';

// Async Thunks
export const submitRentalRequest = createAsyncThunk(
    'rentalRequest/submit',
    async (
        {
            data,
            token
        }: {
            data: {
                businessName: string;
                businessDescription: string;
                experienceLevel: 'beginner' | 'intermediate' | 'expert';
                rentalTermsPreference: string;
            };
            token: string;
        },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.post(`${API_BASE}/users/rental-request`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to submit request");
        }
    }
);

export const fetchCurrentRequest = createAsyncThunk(
    'rentalRequest/fetchCurrent',
    async (token: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_BASE}/users/rental-request`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch request");
        }
    }
);

export const getPendingRequests = createAsyncThunk(
    'rentalRequest/getPending',
    async (
        { token, status = 'pending', page = 1 }: { token: string; status?: string; page?: number },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.get(
                `${API_BASE}/admin/rental-requests?status=${status}&page=${page}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch requests");
        }
    }
);

export const getRequestDetails = createAsyncThunk(
    'rentalRequest/getDetails',
    async ({ requestId, token }: { requestId: string; token: string }, { rejectWithValue }) => {
        try {
            const response = await axios.get(
                `${API_BASE}/admin/rental-requests/${requestId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch request details");
        }
    }
);

export const approveRentalRequest = createAsyncThunk(
    'rentalRequest/approve',
    async (
        { requestId, adminNotes, token }: { requestId: string; adminNotes?: string; token: string },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.put(
                `${API_BASE}/admin/rental-requests/${requestId}/approve`,
                { adminNotes },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to approve request");
        }
    }
);

export const rejectRentalRequest = createAsyncThunk(
    'rentalRequest/reject',
    async (
        { requestId, adminNotes, token }: { requestId: string; adminNotes: string; token: string },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.put(
                `${API_BASE}/admin/rental-requests/${requestId}/reject`,
                { adminNotes },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to reject request");
        }
    }
);

const rentalRequestSlice = createSlice({
    name: 'rentalRequest',
    initialState,
    reducers: {
        clearError: (state, action: PayloadAction<keyof typeof state.sections>) => {
            state.sections[action.payload].error = null;
        },
        resetState: (state) => {
            state.currentRequest = null;
            state.allRequests = [];
            state.sections = initialState.sections;
        }
    },
    extraReducers: (builder) => {
        // Submit Request
        builder
            .addCase(submitRentalRequest.pending, (state) => {
                state.sections.submitRequest.loading = true;
                state.sections.submitRequest.error = null;
            })
            .addCase(submitRentalRequest.fulfilled, (state, action) => {
                state.sections.submitRequest.loading = false;
                state.currentRequest = action.payload.request;
            })
            .addCase(submitRentalRequest.rejected, (state, action) => {
                state.sections.submitRequest.loading = false;
                state.sections.submitRequest.error = action.payload as string;
            });

        // Fetch Current Request
        builder
            .addCase(fetchCurrentRequest.pending, (state) => {
                state.sections.fetchRequest.loading = true;
                state.sections.fetchRequest.error = null;
            })
            .addCase(fetchCurrentRequest.fulfilled, (state, action) => {
                state.sections.fetchRequest.loading = false;
                state.currentRequest = action.payload.request;
            })
            .addCase(fetchCurrentRequest.rejected, (state, action) => {
                state.sections.fetchRequest.loading = false;
                state.sections.fetchRequest.error = action.payload as string;
            });

        // Get Pending Requests
        builder
            .addCase(getPendingRequests.pending, (state) => {
                state.sections.adminList.loading = true;
                state.sections.adminList.error = null;
            })
            .addCase(getPendingRequests.fulfilled, (state, action) => {
                state.sections.adminList.loading = false;
                state.allRequests = action.payload.requests;
                state.pagination = action.payload.pagination;
            })
            .addCase(getPendingRequests.rejected, (state, action) => {
                state.sections.adminList.loading = false;
                state.sections.adminList.error = action.payload as string;
            });

        // Get Request Details
        builder
            .addCase(getRequestDetails.pending, (state) => {
                state.sections.fetchRequest.loading = true;
                state.sections.fetchRequest.error = null;
            })
            .addCase(getRequestDetails.fulfilled, (state, action) => {
                state.sections.fetchRequest.loading = false;
                state.currentRequest = action.payload.request;
            })
            .addCase(getRequestDetails.rejected, (state, action) => {
                state.sections.fetchRequest.loading = false;
                state.sections.fetchRequest.error = action.payload as string;
                state.currentRequest = null;
            });

        // Approve Request
        builder
            .addCase(approveRentalRequest.pending, (state) => {
                state.sections.adminApprove.loading = true;
                state.sections.adminApprove.error = null;
            })
            .addCase(approveRentalRequest.fulfilled, (state, action) => {
                state.sections.adminApprove.loading = false;
                state.currentRequest = action.payload.request;
                const index = state.allRequests.findIndex(r => r._id === action.payload.request._id);
                if (index !== -1) {
                    state.allRequests[index] = action.payload.request;
                }
            })
            .addCase(approveRentalRequest.rejected, (state, action) => {
                state.sections.adminApprove.loading = false;
                state.sections.adminApprove.error = action.payload as string;
            });

        // Reject Request
        builder
            .addCase(rejectRentalRequest.pending, (state) => {
                state.sections.adminReject.loading = true;
                state.sections.adminReject.error = null;
            })
            .addCase(rejectRentalRequest.fulfilled, (state, action) => {
                state.sections.adminReject.loading = false;
                state.currentRequest = action.payload.request;
                const index = state.allRequests.findIndex(r => r._id === action.payload.request._id);
                if (index !== -1) {
                    state.allRequests[index] = action.payload.request;
                }
            })
            .addCase(rejectRentalRequest.rejected, (state, action) => {
                state.sections.adminReject.loading = false;
                state.sections.adminReject.error = action.payload as string;
            });
    }
});

export const { clearError, resetState } = rentalRequestSlice.actions;
export default rentalRequestSlice.reducer;
