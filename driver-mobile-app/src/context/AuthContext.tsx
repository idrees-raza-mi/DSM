import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { loginApi, registerApi } from '../services/auth.api';
import { getMeApi } from '../services/driver.api';

type DriverProfile = {
  id: string;
  status: string;
  onboardingStep: string;
};

type AuthState = {
  token: string | null;
  user: any | null;
  driverProfile: DriverProfile | null;
  loading: boolean;
};

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { token: string; user: any; driverProfile: DriverProfile | null } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_DRIVER_PROFILE'; payload: DriverProfile };

const initialState: AuthState = {
  token: null,
  user: null,
  driverProfile: null,
  loading: false,
};

function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        token: action.payload.token,
        user: action.payload.user,
        driverProfile: action.payload.driverProfile,
      };
    case 'LOGOUT':
      return initialState;
    case 'UPDATE_DRIVER_PROFILE':
      return { ...state, driverProfile: { ...state.driverProfile, ...action.payload } as DriverProfile };
    default:
      return state;
  }
}

type AuthContextType = {
  state: AuthState;
  login: (emailOrPhone: string, password: string) => Promise<void>;
  register: (name: string, phone: string, email: string, password: string) => Promise<void>;
  refreshDriver: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const login = async (emailOrPhone: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    const res = await loginApi(emailOrPhone, password);
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: {
        token: res.data.data.token,
        user: res.data.data.user,
        driverProfile: res.data.data.driverProfile,
      },
    });
  };

  const register = async (name: string, phone: string, email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    const res = await registerApi(name, phone, email, password);
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: {
        token: res.data.data.token,
        user: res.data.data.user,
        driverProfile: res.data.data.driverProfile,
      },
    });
  };

  const refreshDriver = async () => {
    if (!state.token) return;
    const res = await getMeApi(state.token);
    if (res.data?.data) {
      dispatch({
        type: 'UPDATE_DRIVER_PROFILE',
        payload: {
          id: res.data.data._id,
          status: res.data.data.status,
          onboardingStep: res.data.data.onboardingStep,
        },
      });
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ state, login, register, refreshDriver, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};

