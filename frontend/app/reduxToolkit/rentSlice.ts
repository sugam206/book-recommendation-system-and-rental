import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "./store";
interface Rent {
    id: string,
    bookId: string,
    userId: string,
    rentDate: string,
    returnDate: string | null,
    status: 'rented' | 'returned',
    lastUpdatedDate: string
}
interface RentState {
    rents: Rent[],
    loading: boolean,
    error: string | null
}
const initialState: RentState = {
    rents: [],
    loading: false,
    error: null
}
export const fetchRents = createAsyncThunk(
    "rents/fetchRents",
    async (_, { getState }) => {
        const state = getState() as RootState;
        const token = state.auth.token;
        if (!token) {
            throw new Error("No token available");
        }
        const response = await axios.get("http://localhost:5000/api/rents", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data.rents || response.data;
    }
);
const rentSlice = createSlice({
    name: "rents",
    initialState,
    reducers: {
        addRent: (state, action: PayloadAction<Rent>) => {
            state.rents.push(action.payload);
        },
        updateRent: (state, action: PayloadAction<Rent>) => {
            const index = state.rents.findIndex(rent => rent.id === action.payload.id);
            if (index !== -1) {
                state.rents[index] = action.payload;
            }
        },
        deleteRent: (state, action: PayloadAction<string>) => {
            state.rents = state.rents.filter(rent => rent.id !== action.payload);
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRents.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchRents.fulfilled, (state, action) => {
                state.loading = false;
                state.rents = action.payload;
            })
            .addCase(fetchRents.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || "Failed to fetch rents";
            });
    }
});

export const { addRent, updateRent, deleteRent } = rentSlice.actions;