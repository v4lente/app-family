"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/config';

// Adiciona link para cadastro e exibição de erro abaixo do formulário

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    setError("");
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Usuário ou senha inválidos");
        return;
      }
      if (data.token) {
        localStorage.setItem("token", data.token);
        router.push("/dashboard");
      } else {
        setError("Resposta inesperada do backend");
      }
    } catch (_) {
      setError("Erro de conexão com o backend");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md mx-auto">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          className="input-field mt-1"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Senha
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            className="input-field mt-1 pr-10"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.03-10-9s4.477-9 10-9 10 4.03 10 9c0 2.042-.615 3.946-1.675 5.525M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M9.88 9.88A3 3 0 0112 9c1.657 0 3 1.343 3 3 0 .512-.104.997-.293 1.435M6.1 6.1C4.06 7.853 2.5 10.377 2.5 12c0 1.623 1.56 4.147 3.6 5.9M17.9 17.9C19.94 16.147 21.5 13.623 21.5 12c0-1.623-1.56-4.147-3.6-5.9" /></svg>
            )}
          </button>
        </div>
      </div>

      <button type="submit" className="btn-primary w-full">
        Entrar
      </button>
      <div className="mt-2 text-center">
        <span className="text-sm">Não tem conta?</span>{' '}
        <Link href="/register" className="text-primary hover:underline text-sm">Cadastre-se</Link>
      </div>
      {error && (
        <div className="mt-4 text-red-600 text-center text-sm">{error}</div>
      )}
    </form>
  );
}
