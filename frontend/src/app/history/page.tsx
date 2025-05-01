"use client";
import { useEffect, useState } from "react";
import { API_BASE_URL } from '@/config';
import { useToast } from "../../components/Toast";
import { useRouter } from "next/navigation";

interface ActivityHistory {
  id: number;
  name: string;
  description: string;
  performed_at: string;
  icon?: string;
}

type Period = "day" | "week" | "month" | "year";

export default function HistoryPage() {
  const [history, setHistory] = useState<ActivityHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState<Period>("month");
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    setLoading(true);
    fetch(`${API_BASE_URL}/history?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        console.log('Dados de histórico recebidos:', data);
        // Verificar se os dados estão dentro de uma propriedade 'history'
        const historyData = data.history || [];
        setHistory(historyData);
      })
      .catch(() => setError("Erro ao buscar histórico de atividades"))
      .finally(() => setLoading(false));
  }, [period, router]);

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriod(e.target.value as Period);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Histórico de Atividades</h1>
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label htmlFor="period" className="font-medium">Período:</label>
          <select
            id="period"
            value={period}
            onChange={handlePeriodChange}
            className="border rounded px-3 py-2 flex-grow max-w-xs"
          >
            <option value="day">Hoje</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mês</option>
            <option value="year">Este ano</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <span className="loader mr-2"></span> Carregando...
        </div>
      ) : error ? (
        <div className="text-red-600 p-4 bg-white rounded-lg shadow-md">{error}</div>
      ) : history.length === 0 ? (
        <div className="text-gray-600 p-8 bg-white rounded-lg shadow-md text-center">Nenhuma atividade encontrada para o período selecionado.</div>
      ) : (
        <div className="space-y-4">
          {/* Timeline view para dispositivos móveis */}
          <div className="md:hidden">
            {history.map((item) => {
              // Determinar ícone baseado no nome da atividade
              const getIcon = (name: string): string => {
                const lowerName = name.toLowerCase();
                if (lowerName.includes('louça') || lowerName.includes('prato')) return '🍽️';
                if (lowerName.includes('roupa') || lowerName.includes('lavar')) return '👕';
                if (lowerName.includes('cachorro') || lowerName.includes('passear')) return '🐕';
                if (lowerName.includes('lixo')) return '🗑️';
                if (lowerName.includes('compra') || lowerName.includes('mercado')) return '🛒';
                if (lowerName.includes('cozinhar') || lowerName.includes('jantar')) return '🍳';
                if (lowerName.includes('limpar') || lowerName.includes('limpeza')) return '🧹';
                if (lowerName.includes('planta') || lowerName.includes('jardim')) return '🌱';
                if (lowerName.includes('banho') || lowerName.includes('criança')) return '🛁';
                if (lowerName.includes('escola') || lowerName.includes('dever')) return '📚';
                return '✅';
              };
              
              const icon = item.icon || getIcon(item.name);
              const date = new Date(item.performed_at);
              const formattedDate = date.toLocaleDateString();
              const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              return (
                <div key={item.id} className="bg-white p-4 rounded-lg shadow-md flex items-start">
                  <div className="text-3xl mr-4">{icon}</div>
                  <div className="flex-1">
                    <h3 className="font-bold">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <div className="text-xs text-gray-500 mt-2">
                      {formattedDate} às {formattedTime}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Tabela para desktop */}
          <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="w-full min-w-[450px]">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-3 text-left">Atividade</th>
                  <th className="p-3 text-left">Descrição</th>
                  <th className="p-3 text-left">Realizada em</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => {
                  const date = new Date(item.performed_at);
                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{item.name}</td>
                      <td className="p-3">{item.description}</td>
                      <td className="p-3">{date.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
