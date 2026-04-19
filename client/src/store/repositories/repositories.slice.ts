import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import i18n from "../../i18n";
import { type Repository, repositoriesApi } from "../../api/repositories";

interface RepositoriesState {
  items: Repository[];
  isFetching: boolean;
  isAdding: boolean;
  error: string | null;
}

const initialState: RepositoriesState = {
  items: [],
  isFetching: false,
  isAdding: false,
  error: null,
};

export const fetchRepositories = createAsyncThunk(
  "repositories/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await repositoriesApi.getAll();
    } catch {
      return rejectWithValue(i18n.t("errors.repositories.loadFailed"));
    }
  },
);

export const addRepository = createAsyncThunk(
  "repositories/add",
  async (payload: { owner: string; name: string }, { rejectWithValue }) => {
    try {
      return await repositoriesApi.create(payload.owner, payload.name);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? i18n.t("errors.repositories.addFailed");
      return rejectWithValue(
        Array.isArray(message) ? message.join(", ") : message,
      );
    }
  },
);

export const removeRepository = createAsyncThunk(
  "repositories/remove",
  async (id: string, { rejectWithValue }) => {
    try {
      await repositoriesApi.remove(id);
      return id;
    } catch {
      return rejectWithValue(i18n.t("errors.repositories.removeFailed"));
    }
  },
);

export const refreshRepository = createAsyncThunk(
  "repositories/refresh",
  async (id: string, { rejectWithValue }) => {
    try {
      return await repositoriesApi.refresh(id);
    } catch {
      return rejectWithValue(i18n.t("errors.repositories.refreshFailed"));
    }
  },
);

const repositoriesSlice = createSlice({
  name: "repositories",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch all
      .addCase(fetchRepositories.pending, (state) => {
        state.isFetching = true;
        state.error = null;
      })
      .addCase(fetchRepositories.fulfilled, (state, action) => {
        state.isFetching = false;
        state.items = action.payload;
      })
      .addCase(fetchRepositories.rejected, (state, action) => {
        state.isFetching = false;
        state.error = action.payload as string;
      })
      // add
      .addCase(addRepository.pending, (state) => {
        state.isAdding = true;
        state.error = null;
      })
      .addCase(addRepository.fulfilled, (state, action) => {
        state.isAdding = false;
        state.items.unshift(action.payload);
      })
      .addCase(addRepository.rejected, (state) => {
        state.isAdding = false;
      })
      // remove
      .addCase(removeRepository.fulfilled, (state, action) => {
        state.items = state.items.filter((r) => r.id !== action.payload);
      })
      .addCase(removeRepository.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // refresh
      .addCase(refreshRepository.fulfilled, (state, action) => {
        const idx = state.items.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(refreshRepository.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = repositoriesSlice.actions;
export default repositoriesSlice.reducer;
