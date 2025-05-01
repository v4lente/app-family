"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "./Navbar";

export default function NavbarWrapper() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  
  // Páginas que não devem mostrar a barra de navegação
  const publicPages = ['/login', '/register', '/'];
  const isPublicPage = publicPages.includes(pathname);
  
  // Páginas que requerem autenticação
  const protectedPages = [
    '/dashboard', 
    '/activity', 
    '/history', 
    '/stats', 
    '/family'
  ];
  const isProtectedPage = protectedPages.some(page => pathname.startsWith(page));
  
  useEffect(() => {
    // Verifica se o usuário está logado
    const checkAuth = () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const isAuthenticated = !!token;
        setIsLoggedIn(isAuthenticated);
        
        // Redireciona usuários não autenticados para o login se estiverem tentando acessar páginas protegidas
        if (!isAuthenticated && isProtectedPage) {
          router.push('/login');
        }
        
        // Redireciona usuários autenticados para o dashboard se estiverem tentando acessar páginas públicas
        // Exceto para a página de registro quando acessada a partir do dashboard
        const fromDashboard = document.referrer.includes('/dashboard');
        if (isAuthenticated && isPublicPage && pathname !== '/' && pathname !== '/register') {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Verifica ao carregar o componente
    checkAuth();
    
    // Adiciona um listener para mudanças no localStorage
    window.addEventListener("storage", checkAuth);
    
    // Limpa o listener quando o componente for desmontado
    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, [isProtectedPage, isPublicPage, pathname, router]);
  
  // Durante o carregamento, não mostra nada para evitar flash de conteúdo
  if (isLoading) {
    return null;
  }
  
  // Não exibe a barra de navegação em páginas públicas ou quando o usuário não está logado
  if (isPublicPage || !isLoggedIn) {
    return null;
  }
  
  // Exibe a barra de navegação apenas para usuários logados em páginas protegidas
  return <Navbar />;
}
