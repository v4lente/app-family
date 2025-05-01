"use client";

import { useEffect, useState } from "react";
import { useToast } from "../../../../components/Toast";
import { useRouter, useParams } from "next/navigation";
import { API_BASE_URL } from '@/config';

interface User {
  id: number;
  name: string;
  email: string;
  active?: boolean;
  family_id?: number;
  family_name?: string;
}

interface Family {
  id: number;
  name: string;
  invite_code: string;
}

export default function EditUserPage() {
  const [user, setUser] = useState<User | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  
  // Obter o ID do usuário da URL
  useEffect(() => {
    const path = window.location.pathname;
    const id = path.split('/').pop();
    if (id) {
      setUserId(id);
    }
  }, []);
  const { showToast } = useToast();

  // Buscar as famílias disponíveis
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${API_BASE_URL}/family`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        console.log('Dados de famílias recebidos:', data);
        const familiesData = data.families || data || [];
        setFamilies(familiesData);
      })
      .catch((error) => {
        console.error('Erro ao buscar famílias:', error);
        // Não definir erro aqui, apenas log, pois não é crítico
      });
  }, [router]);

  // Buscar os dados do usuário
  useEffect(() => {
    if (!userId) return;
    
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    setLoading(true);
    fetch(`${API_BASE_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        console.log('Dados do usuário recebidos:', data);
        const userData = data.user || data;
        setUser(userData);
      })
      .catch((error) => {
        console.error('Erro ao buscar usuário:', error);
        setError("Erro ao buscar usuário");
      })
      .finally(() => setLoading(false));
  }, [router, userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!user) return;
    const value = e.target.name === 'family_id' ? Number(e.target.value) || 0 : e.target.value;
    setUser({ ...user, [e.target.name]: value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userId) return;
    setSaving(true);
    const token = localStorage.getItem("token");
    
    // Preparar os dados para envio
    const userData = {
      name: user.name,
      email: user.email,
      family_id: user.family_id || 0
    };
    
    console.log('Enviando dados:', userData);
    
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao atualizar usuário");
      }
      
      const updatedUser = await res.json();
      console.log('Usuário atualizado:', updatedUser);
      
      showToast("Usuário atualizado com sucesso!", "success");
      router.push("/dashboard");
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      showToast(error instanceof Error ? error.message : "Erro ao atualizar usuário", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Carregando...</div>;
  if (error || !user) return <div className="p-8 text-red-600">{error || "Usuário não encontrado"}</div>;

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Editar Usuário</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nome
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={user.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={user.email}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
          />
        </div>
        <div>
          <label htmlFor="family_id" className="block text-sm font-medium text-gray-700">
            Família
          </label>
          <select
            id="family_id"
            name="family_id"
            value={user.family_id || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
          >
            <option value="">Selecione uma família</option>
            {families.map((family) => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
          </select>
          {user.family_name && (
            <p className="mt-1 text-sm text-gray-500">
              Família atual: {user.family_name}
            </p>
          )}
        </div>
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
