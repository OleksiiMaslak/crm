import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth/auth.slice";
import repositoriesReducer from "./repositories/repositories.slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    repositories: repositoriesReducer,
  },
});

export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
