import { configureStore } from "@reduxjs/toolkit";
import { dateSlice } from "./dateSlice";

export const store = configureStore({
    reducer: {
        dateStore: dateSlice.reducer
    }
})