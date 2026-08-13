import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// Représente l'utilisateur connecté stocké en mémoire et en localStorage
interface AuthUser {
  token: string;
  role: string;
}

// Contrat du context : ce que les composants peuvent consommer
interface AuthContextType {
  user: AuthUser | null;
  saveUser: (token: string, role: string) => void;
  logout: () => void;
}

// Création du context avec null par défaut (vérifié dans useAuth)
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {

  const [user, setUser] = useState<AuthUser | null>(() => {
    // Initialisation lazy : restaure la session depuis localStorage au rechargement de page
    const token = localStorage.getItem('token');
    const role  = localStorage.getItem('role');
    return token && role ? { token, role } : null;
  });

  // Persiste le token et le rôle en localStorage + met à jour le state React
  const saveUser = (token: string, role: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    setUser({ token, role });
  };

  // Supprime la session partout (localStorage + state React)
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, saveUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé : garantit que le context est bien utilisé dans AuthProvider
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
};