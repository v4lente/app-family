"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  if (pathname === '/login' || pathname === '/register') return null;
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);


  useEffect(() => {
    const checkAuth = () => setIsAuthenticated(!!localStorage.getItem('token'));
    checkAuth();
    window.addEventListener('storage', checkAuth);
    window.addEventListener('focus', checkAuth);
    window.addEventListener('authChanged', checkAuth);
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('focus', checkAuth);
      window.removeEventListener('authChanged', checkAuth);
    };
  }, []);

  const handleLogin = () => {
    window.dispatchEvent(new Event('authChanged'));
    router.push('/login');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    window.dispatchEvent(new Event('authChanged'));
    router.push('/login');
  };

  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-primary">Atividades da Família</h1>
            </div>
          </div>
          <div className="flex items-center">
            {isAuthenticated ? (
              <button className="btn-primary" onClick={handleLogout}>Sair</button>
            ) : (
              <button className="btn-primary" onClick={handleLogin}>Entrar</button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
