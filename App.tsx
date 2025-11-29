
import React from 'react';
import { ChatInterface } from './components/ChatInterface';
import { Dashboard } from './components/Dashboard';

export default function App() {
  // Roteamento simples baseado na URL atual
  const path = window.location.pathname;

  if (path === '/dados') {
    return <Dashboard />;
  }

  // Rota padrão é o chat
  return <ChatInterface />;
}