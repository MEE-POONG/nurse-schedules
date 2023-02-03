import { createSlice } from "@reduxjs/toolkit";
import dayjs from "dayjs";

const initialState = {
  value: { month: dayjs().month(), year: dayjs().year() },
};

export const dateSlice = createSlice({
  name: "dateStore",
  initialState: initialState,
  reducers: {
    setMonth: (state, action) => {
      state.value.month = action.payload;
    },
    setYear: (state, action) => {
      state.value.year = action.payload;
    },
  },
});

export const { setMonth, setYear } = dateSlice.actions;
export default dateSlice.reducer;
