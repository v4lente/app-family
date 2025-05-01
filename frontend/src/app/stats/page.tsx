"use client";
import { useEffect, useState } from "react";
import { useToast } from "../../components/Toast";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from '@/config';
import StatsChart from "../../components/StatsChart";

interface StatsData {
  name: string;
  total: number;
}

interface Family {
  id: number;
  name: string;
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("week");
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Buscar famílias do usuário
    fetch(`${API_BASE_URL}/family`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        
        // O backend retorna um objeto com uma propriedade 'families'
        const familiesArray = data.families || [];
        console.log('Famílias recebidas:', familiesArray);
        setFamilies(familiesArray);
        
        if (familiesArray.length > 0) {
          setSelectedFamily(familiesArray[0].id.toString());
        }
      })
      .catch((error) => {
        console.error('Erro ao buscar famílias:', error);
        setError("Erro ao buscar famílias");
        setFamilies([]);
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!selectedFamily) return;

    const token = localStorage.getItem("token");
    setLoading(true);

    fetch(`${API_BASE_URL}/stats?family_id=${selectedFamily}&period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        console.log('Dados de estatísticas recebidos:', data);
        // Verificar se os dados estão dentro de uma propriedade 'stats'
        const statsData = data.stats || data || [];
        setStats(statsData);
      })
      .catch(() => {
        setError("Erro ao buscar estatísticas");
        showToast("Erro ao carregar estatísticas", "error");
      })
      .finally(() => setLoading(false));
  }, [selectedFamily, period, showToast]);

  const handleExport = () => {
    if (!selectedFamily) return;
    
    const token = localStorage.getItem("token");
    
    fetch(`${API_BASE_URL}/stats/export?family_id=${selectedFamily}&period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        
        // Criar um blob a partir da resposta
        const blob = await res.blob();
        
        // Criar URL para download
        const url = window.URL.createObjectURL(blob);
        
        // Criar link e simular clique para download
        const a = document.createElement('a');
        a.href = url;
        a.download = `estatisticas_${period}.csv`;
        document.body.appendChild(a);
        a.click();
        
        // Limpar
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast("Dados exportados com sucesso!", "success");
      })
      .catch(() => {
        showToast("Erro ao exportar dados", "error");
      });
  };

  const getPeriodName = (periodKey: string): string => {
    const periods: Record<string, string> = {
      day: "Hoje",
      week: "Esta semana",
      month: "Este mês",
      year: "Este ano"
    };
    return periods[periodKey] || periodKey;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Estatísticas e Ranking</h1>
      
      {loading && (!families || families.length === 0) ? (
        <div className="flex justify-center items-center h-32">
          <span className="loader mr-2"></span> Carregando...
        </div>
      ) : error && (!families || families.length === 0) ? (
        <div className="text-red-600 p-4 bg-white rounded-lg shadow-md mb-4">{error}</div>
      ) : (
        <>
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="family" className="block text-sm font-medium text-gray-700 mb-1">
                  Família
                </label>
                <select
                  id="family"
                  className="w-full border rounded px-3 py-2"
                  value={selectedFamily}
                  onChange={(e) => setSelectedFamily(e.target.value)}
                >
                  {Array.isArray(families) && families.map((family) => (
                    <option key={family.id} value={family.id}>
                      {family.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">
                  Período
                </label>
                <select
                  id="period"
                  className="w-full border rounded px-3 py-2"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  <option value="day">Hoje</option>
                  <option value="week">Esta semana</option>
                  <option value="month">Este mês</option>
                  <option value="year">Este ano</option>
                </select>
              </div>
            </div>
            
            <button 
              className="btn-secondary w-full mt-2"
              onClick={handleExport}
            >
              Exportar dados (CSV)
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-32 bg-white rounded-lg shadow-md">
              <span className="loader mr-2"></span> Carregando estatísticas...
            </div>
          ) : stats.length > 0 ? (
            <>
              <StatsChart 
                data={stats} 
                title={`Ranking de atividades - ${getPeriodName(period)}`} 
              />
              
              <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4">Ranking</h3>
                <div className="space-y-4">
                  {stats.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-3">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-600">{item.total} atividades</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <p className="text-gray-600">Nenhuma atividade registrada neste período.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
