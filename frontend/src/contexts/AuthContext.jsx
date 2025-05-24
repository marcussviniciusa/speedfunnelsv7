import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Função logout definida antes para poder ser usada
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      // Limpar dados independente do resultado da API
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Verificar se há token no localStorage ao iniciar
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      console.log('🔍 Iniciando autenticação...', { token: !!token, savedUser: !!savedUser });
      
      if (token && savedUser) {
        try {
          // Verificar se o token ainda é válido
          console.log('📡 Verificando token com API...');
          const response = await authAPI.getProfile();
          console.log('📊 Resposta da API:', response.data);
          setUser(response.data.data.user);
          setIsAuthenticated(true);
          console.log('✅ Autenticação restaurada com sucesso');
        } catch (error) {
          // Token inválido, limpar dados
          console.log('❌ Token inválido, fazendo logout:', error.message);
          console.log('🔍 Erro completo:', error);
          logout();
        }
      } else {
        console.log('🔒 Nenhum token encontrado, usuário não logado');
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { user, accessToken, refreshToken } = response.data.data;

      // Salvar dados no localStorage
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      // Atualizar estado
      setUser(user);
      setIsAuthenticated(true);

      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao fazer login';
      return { success: false, error: errorMessage };
    }
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 