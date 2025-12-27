import React, { createContext, useContext } from 'react';

export const AuthContext = createContext({
  token: null,
  setToken: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);
