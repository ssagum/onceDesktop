import { filterHiddenDocuments } from "../utils/filterUtils";

const dataSlice = createSlice({
  name: "data",
  initialState: [],
  reducers: {
    setData: (state, action) => {
      return filterHiddenDocuments(action.payload);
    },
    // ... 다른 리듀서들
  },
});
