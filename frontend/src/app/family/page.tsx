"use client";
import { useEffect, useState } from "react";
import { useToast } from "../../components/Toast";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from '@/config';

interface FamilyMember {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  joined_at: string;
}

interface Family {
  id: number;
  name: string;
  invite_code: string;
  created_at: string;
  members: FamilyMember[];
}

export default function FamilyPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newFamilyName, setNewFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [creatingFamily, setCreatingFamily] = useState(false);
  const [joiningFamily, setJoiningFamily] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchFamilies();
  }, [router]);

  const fetchFamilies = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    
    try {
      const res = await fetch(`${API_BASE_URL}/family`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error();
      
      const data = await res.json();
      console.log('Dados de famílias recebidos:', data);
      
      // Verificar o formato da resposta e processar adequadamente
      const familiesData = data.families || data || [];
      console.log('Famílias processadas:', familiesData);
      setFamilies(familiesData);
      
      if (familiesData && familiesData.length > 0) {
        setSelectedFamily(familiesData[0]);
      }
    } catch (err) {
      setError("Erro ao buscar famílias");
      showToast("Erro ao carregar famílias", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName.trim()) {
      showToast("Nome da família é obrigatório", "error");
      return;
    }
    
    setCreatingFamily(true);
    const token = localStorage.getItem("token");
    
    try {
      const res = await fetch(`${API_BASE_URL}/family`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newFamilyName }),
      });
      
      if (!res.ok) throw new Error();
      
      const data = await res.json();
      showToast("Família criada com sucesso!", "success");
      setNewFamilyName("");
      
      // Atualizar a lista de famílias
      fetchFamilies();
    } catch (err) {
      showToast("Erro ao criar família", "error");
    } finally {
      setCreatingFamily(false);
    }
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      showToast("Código de convite é obrigatório", "error");
      return;
    }
    
    setJoiningFamily(true);
    const token = localStorage.getItem("token");
    
    try {
      const res = await fetch(`${API_BASE_URL}/family/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ invite_code: inviteCode }),
      });
      
      if (!res.ok) throw new Error();
      
      showToast("Você entrou na família com sucesso!", "success");
      setInviteCode("");
      
      // Atualizar a lista de famílias
      fetchFamilies();
    } catch (err) {
      showToast("Erro ao entrar na família. Verifique o código de convite.", "error");
    } finally {
      setJoiningFamily(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!selectedFamily) return;
    if (!confirm("Tem certeza que deseja remover este membro da família?")) return;
    
    const token = localStorage.getItem("token");
    
    try {
      const res = await fetch(`${API_BASE_URL}/family/${selectedFamily.id}/members/${memberId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error();
      
      showToast("Membro removido com sucesso!", "success");
      
      // Atualizar a família selecionada
      fetchFamilies();
    } catch (err) {
      showToast("Erro ao remover membro", "error");
    }
  };

  const toggleAdminStatus = async (memberId: number, currentStatus: boolean) => {
    if (!selectedFamily) return;
    
    const token = localStorage.getItem("token");
    
    try {
      const res = await fetch(`${API_BASE_URL}/family/${selectedFamily.id}/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_admin: !currentStatus }),
      });
      
      if (!res.ok) throw new Error();
      
      showToast(`Usuário ${currentStatus ? "não é mais admin" : "agora é admin"}!`, "success");
      
      // Atualizar a família selecionada
      fetchFamilies();
    } catch (err) {
      showToast("Erro ao alterar status de admin", "error");
    }
  };

  const copyInviteCode = () => {
    if (!selectedFamily) return;
    
    navigator.clipboard.writeText(selectedFamily.invite_code)
      .then(() => showToast("Código de convite copiado!", "success"))
      .catch(() => showToast("Erro ao copiar código", "error"));
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Família</h1>
      
      {loading && families.length === 0 ? (
        <div className="flex justify-center items-center h-32">
          <span className="loader mr-2"></span> Carregando...
        </div>
      ) : error && families.length === 0 ? (
        <div className="text-red-600 p-4 bg-white rounded-lg shadow-md mb-6">{error}</div>
      ) : (
        <>
          {families.length > 0 ? (
            <div className="mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="mb-4">
                  <label htmlFor="family-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Selecione uma família
                  </label>
                  <select
                    id="family-select"
                    className="w-full border rounded px-3 py-2"
                    value={selectedFamily?.id || ""}
                    onChange={(e) => {
                      const family = families.find(f => f.id === Number(e.target.value));
                      if (family) setSelectedFamily(family);
                    }}
                  >
                    {families.map((family) => (
                      <option key={family.id} value={family.id}>
                        {family.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedFamily && (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold">{selectedFamily.name}</h2>
                      <div>
                        <button
                          type="button"
                          className="text-sm text-blue-600 hover:text-blue-800"
                          onClick={() => setShowInviteCode(!showInviteCode)}
                        >
                          {showInviteCode ? "Ocultar código" : "Mostrar código de convite"}
                        </button>
                      </div>
                    </div>
                    
                    {showInviteCode && (
                      <div className="mb-4 p-3 bg-gray-50 rounded border flex justify-between items-center">
                        <code className="text-sm">{selectedFamily.invite_code}</code>
                        <button
                          type="button"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          onClick={copyInviteCode}
                        >
                          Copiar
                        </button>
                      </div>
                    )}
                    
                    <h3 className="font-bold text-lg mb-2 mt-6">Membros da família</h3>
                    <div className="space-y-3">
                      {selectedFamily.members && selectedFamily.members.map((member) => (
                        <div key={member.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-gray-600">{member.email}</div>
                            {member.is_admin && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mt-1 inline-block">
                                Administrador
                              </span>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              className="text-sm text-blue-600 hover:text-blue-800"
                              onClick={() => toggleAdminStatus(member.id, member.is_admin)}
                            >
                              {member.is_admin ? "Remover admin" : "Tornar admin"}
                            </button>
                            <button
                              type="button"
                              className="text-sm text-red-600 hover:text-red-800"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6 text-center">
              <p className="text-gray-600 mb-4">Você ainda não participa de nenhuma família.</p>
              <p className="text-gray-600">Crie uma nova família ou entre em uma existente usando o código de convite.</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4">Criar nova família</h2>
              <form onSubmit={handleCreateFamily}>
                <div className="mb-4">
                  <label htmlFor="family-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da família
                  </label>
                  <input
                    type="text"
                    id="family-name"
                    className="w-full border rounded px-3 py-2"
                    value={newFamilyName}
                    onChange={(e) => setNewFamilyName(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary w-full flex items-center justify-center"
                  disabled={creatingFamily}
                >
                  {creatingFamily && <span className="loader mr-2"></span>}
                  {creatingFamily ? "Criando..." : "Criar família"}
                </button>
              </form>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4">Entrar em uma família</h2>
              <form onSubmit={handleJoinFamily}>
                <div className="mb-4">
                  <label htmlFor="invite-code" className="block text-sm font-medium text-gray-700 mb-1">
                    Código de convite
                  </label>
                  <input
                    type="text"
                    id="invite-code"
                    className="w-full border rounded px-3 py-2"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn-secondary w-full flex items-center justify-center"
                  disabled={joiningFamily}
                >
                  {joiningFamily && <span className="loader mr-2"></span>}
                  {joiningFamily ? "Entrando..." : "Entrar na família"}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
