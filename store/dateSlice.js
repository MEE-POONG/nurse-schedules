import dayFunction from "@/utils/day";
import { createSlice } from "@reduxjs/toolkit";
const {yearEN , monthEN} = dayFunction("","")

const initialState = {
  value: { month: +monthEN - 1, year: yearEN },
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

export const { setMonth,setYear } = dateSlice.actions;
export default dateSlice.reducer;
