import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  value: { month: "", year: "" },
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
