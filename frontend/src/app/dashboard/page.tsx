"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "../../components/Toast";
import { PageLoader, ButtonLoader } from "../../components/Loader";
import { API_BASE_URL } from '@/config';

interface User {
  id: number;
  name: string;
  email: string;
  active?: boolean;
  is_superuser?: boolean;
  created_at?: string;
  family_id?: number;
  family_name?: string;
}

interface Family {
  id: number;
  name: string;
  invite_code?: string;
}

export default function DashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<number>(0); // 0 significa todas as famílias
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const { showToast } = useToast();
  const [deleting, setDeleting] = useState<number | null>(null);

  // Efeito para filtrar os usuários quando o filtro de família mudar
  useEffect(() => {
    if (selectedFamily === 0) {
      // Mostrar todos os usuários
      setFilteredUsers(users);
    } else {
      // Filtrar usuários pela família selecionada
      setFilteredUsers(users.filter(user => user.family_id === selectedFamily));
    }
  }, [selectedFamily, users]);

  // Efeito para buscar usuários e famílias
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    setLoading(true);
    
    // Buscar famílias
    const fetchFamilies = fetch(`${API_BASE_URL}/family`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async (res) => {
      if (!res.ok) throw new Error("Erro ao buscar famílias");
      const data = await res.json();
      const familiesData = data.families || data || [];
      console.log('Famílias recebidas:', familiesData);
      return familiesData;
    });
    
    // Buscar usuários com informações de família
    const fetchUsers = fetch(`${API_BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async (res) => {
      if (!res.ok) throw new Error("Erro ao buscar membros");
      const data = await res.json();
      const usersArray = Array.isArray(data) ? data : (data.users || []);
      console.log('Membros recebidos:', usersArray);
      return usersArray;
    });
    
    // Executar ambas as requisições em paralelo
    Promise.all([fetchFamilies, fetchUsers])
      .then(([familiesData, usersData]) => {
        setFamilies(familiesData);
        setUsers(usersData);
        setFilteredUsers(usersData); // Inicialmente, mostrar todos os usuários
      })
      .catch((error) => {
        console.error('Erro ao buscar dados:', error);
        setError("Erro ao carregar dados");
      })
      .finally(() => setLoading(false));
  }, [router]);
  
  // Manipulador para mudança no filtro de família
  const handleFamilyFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFamily(Number(e.target.value));
  };

  const handleEdit = (id: number) => {
    router.push(`/dashboard/edit/${id}`);
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Deseja realmente excluir/desativar este usuário?")) return;
    setDeleting(id);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showToast("Usuário excluído/desativado com sucesso!", "success");
    } catch {
      showToast("Erro ao excluir/desativar usuário", "error");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <PageLoader text="Carregando lista de membros da família..." />;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Membros da Família</h1>
      
      {error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <>
          {/* Filtro por família */}
          <div className="mb-4">
            <label htmlFor="family-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por família:
            </label>
            <select
              id="family-filter"
              value={selectedFamily}
              onChange={handleFamilyFilterChange}
              className="w-full md:w-64 p-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value={0}>Todas as famílias</option>
              {families.map((family) => (
                <option key={family.id} value={family.id}>
                  {family.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border mt-4 min-w-[600px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2">ID</th>
                  <th className="p-2">Nome</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Família</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">
                      Nenhum membro encontrado para esta família.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-t hover:bg-gray-50">
                      <td className="p-2 text-center">{user.id}</td>
                      <td className="p-2">{user.name}</td>
                      <td className="p-2">{user.email}</td>
                      <td className="p-2">
                        {user.family_name || (
                          <span className="text-gray-400 italic">Sem família</span>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {user.active !== undefined ? (user.active ? "Ativo" : "Inativo") : 
                        user.is_superuser ? "Superusuário" : "Ativo"}
                      </td>
                      <td className="p-2 flex gap-2 justify-center">
                        <button
                          className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors min-w-[60px]"
                          onClick={() => handleEdit(user.id)}
                        >
                          Editar
                        </button>
                        <button
                          className="p-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center min-w-[60px]"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deleting === user.id}
                        >
                          {deleting === user.id ? <ButtonLoader size="small" color="white" /> : "Excluir"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      
      <div className="mt-6 flex flex-wrap gap-4">
        <Link 
          href="/dashboard/new-user" 
          className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Cadastrar novo membro
        </Link>
        
        <Link 
          href="/family" 
          className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
        >
          Gerenciar famílias
        </Link>
      </div>
    </div>
  );
}
