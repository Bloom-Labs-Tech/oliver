import { createStore } from 'zustand/vanilla';
import { navigate } from '~/actions/common';

export type AuthState = {
  status: 'loading' | 'unauthenticated';
  session: null;
} | {
  status: 'authenticated';
  session: AuthSession;
}

export type AuthActions = {
  login: () => void;
  logout: () => void;
}

export type AuthStore = AuthState & AuthActions;

export const defaultAuthState: AuthState = {
  status: 'loading',
  session: null,
}

export const createAuthStore = (
  initState: AuthState = defaultAuthState
) => {
  const state = createStore<AuthStore>((set) => ({
    ...initState,
    login: () => {
      navigate('http://localhost:3001/auth/login');
    },
    logout: () => fetch('http://localhost:3000/api/auth/signout').then(() => {
      set({ status: 'unauthenticated', session: null });
    }),
  }));

  fetch('http://localhost:3000/api/auth/session', {
    credentials: 'include',
  })
    .then((res) => res.json())
    .then((session) => {
      if (session.session?.id) {
        state.setState({ status: 'authenticated', session: session.session });
      } else {
        state.setState({ status: 'unauthenticated', session: null });
      }
    }).catch(() => {
      state.setState({ status: 'unauthenticated', session: null });
    });
  
  return state;
};
