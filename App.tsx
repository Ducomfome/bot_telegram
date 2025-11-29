
import React from 'react';
import { OnlyFansProfile } from './components/OnlyFansProfile';
import { Dashboard } from './components/Dashboard';

export default function App() {
  // Roteamento simples baseado na URL atual
  const path = window.location.pathname.replace(/\/$/, '');

  if (path === '/dados') {
    return <Dashboard />;
  }

  // Rota padrão agora é o Perfil OnlyFans
  return <OnlyFansProfile />;
}
