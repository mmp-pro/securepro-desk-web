// src/hooks/useInactivityTimer.js
import { useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const INACTIVITY_LIMIT = 2 * 60 * 1000; // 2 minutos exactos

export const useInactivityTimer = () => {
  const { logout } = useAuth();

  const handleLogout = useCallback(() => {
    console.log("⏰ Inactividad detectada: Cerrando sesión...");
    logout();
  }, [logout]);

  useEffect(() => {
    let timer;
    
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(handleLogout, INACTIVITY_LIMIT);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    resetTimer();

    events.forEach(event => window.addEventListener(event, resetTimer));

    return () => {
      clearTimeout(timer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [handleLogout]);
};