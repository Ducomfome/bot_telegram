import React from 'react';
import { ChatInterface } from './components/ChatInterface';
import { Dashboard } from './components/Dashboard';

export default function App() {
  // Roteamento simples baseado na URL atual
  // Remove a barra final para garantir que /dados e /dados/ funcionem igual
  const path = window.location.pathname.replace(/\/$/, '');

  if (path === '/dados') {
    return <Dashboard />;
  }

  // Rota padrão é o chat
  return <ChatInterface />;
}