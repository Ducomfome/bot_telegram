
import React from 'react';
import { OnlyFansProfile } from './components/OnlyFansProfile';
import { Dashboard } from './components/Dashboard';

export default function App() {
  // Roteamento simples baseado na URL atual
  // Remove a barra final para garantir que /dados e /dados/ funcionem igual
  const path = window.location.pathname.replace(/\/$/, '');

  if (path === '/dados') {
    return <Dashboard />;
  }

  // Rota padrão agora é o Perfil OnlyFans
  return <OnlyFansProfile />;
}
