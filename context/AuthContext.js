// context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthProvider mounted, checking session...");
    // Revisa sesión al montar el componente
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error("Error getting session:", error);
      console.log("Session restored:", data?.session?.user?.id);
      setUser(data?.session?.user || null);
      setLoading(false);
    });

    // Suscripción a cambios de auth
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, session?.user?.id);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Ensure profile exists (fix for existing users)
    if (data.user) {
      const { data: profile } = await supabase.from('profiles').select('id').eq('id', data.user.id).single();
      if (!profile) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: email,
          display_name: email.split('@')[0],
          updated_at: new Date(),
        });
      }
    }
  };

  const register = async (email, password, username) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: username,
        },
      },
    });
    if (authError) throw authError;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
