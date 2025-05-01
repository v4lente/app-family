"use client";
import { useEffect, useState } from "react";
import { useToast } from "../../components/Toast";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from '@/config';
import ActivityGrid from "../../components/ActivityGrid";

interface Activity {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetch(`${API_BASE_URL}/activity`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        console.log('Dados de atividades recebidos:', data);
        // Verificar o formato da resposta e processar adequadamente
        const activitiesData = data.activities || data || [];
        console.log('Atividades processadas:', activitiesData);
        setActivities(activitiesData);
      })
      .catch(() => setError("Erro ao buscar atividades"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/activity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setForm({ name: "", description: "" });
      // Atualiza a lista
      const updated = await res.json();
      setActivities((prev) => [...prev, updated.activity]);
      showToast("Atividade cadastrada com sucesso!", "success");
    } catch {
      showToast("Erro ao cadastrar atividade", "error");
    } finally {
      setSaving(false);
    }
  };

  // Função para registrar participação
  const handleLogActivity = async () => {
    if (!selectedActivityId) {
      showToast("Selecione uma atividade para registrar.", "info");
      return;
    }
    setLogging(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/activity/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activity_id: selectedActivityId }),
      });
      if (!res.ok) throw new Error();
      showToast("Participação registrada com sucesso!", "success");
    } catch {
      showToast("Erro ao registrar participação", "error");
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Atividades</h1>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <span className="loader mr-2"></span> Carregando...
        </div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Registrar atividade</h2>
            <ActivityGrid 
              activities={activities} 
              onActivityLogged={() => {
                // Atualizar a lista após o registro
                const token = localStorage.getItem("token");
                fetch(`${API_BASE_URL}/activity`, {
                  headers: { Authorization: `Bearer ${token}` },
                })
                  .then(async (res) => {
                    if (!res.ok) throw new Error();
                    const data = await res.json();
                    setActivities(data.activities || []);
                  })
                  .catch(() => setError("Erro ao atualizar atividades"));
              }} 
            />
          </div>
          
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Lista de atividades</h2>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="w-full min-w-[450px]">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-3 text-left">Nome</th>
                    <th className="p-3 text-left">Descrição</th>
                    <th className="p-3 text-left">Criada em</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => (
                    <tr key={activity.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{activity.name}</td>
                      <td className="p-3">{activity.description}</td>
                      <td className="p-3">{new Date(activity.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">Cadastrar nova atividade</h2>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
          <input
            type="text"
            id="name"
            name="name"
            className="input-field mt-1"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
          <textarea
            id="description"
            name="description"
            className="input-field mt-1"
            value={form.description}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="btn-primary flex items-center" disabled={saving}>
          {saving && <span className="loader mr-2"></span>}
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </div>
  );
}
