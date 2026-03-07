import { configureStore } from "@reduxjs/toolkit";
import boookreducer from "./slice";
import authReducer, { loadUserFromStorage } from "./authSlice";
import profileReducer from "./profileSlice";
import rentalRequestReducer from "./rentalRequestSlice";

export const store = configureStore({
    reducer: {
        books: boookreducer,
        auth: authReducer,
        profile: profileReducer,
        rentalRequest: rentalRequestReducer
    }
});
if (typeof window !== "undefined") {
    store.dispatch(loadUserFromStorage());
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

