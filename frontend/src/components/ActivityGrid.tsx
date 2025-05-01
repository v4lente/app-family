"use client";
import { useState } from 'react';
import { useToast } from './Toast';
import { API_BASE_URL } from '@/config';

interface Activity {
  id: number;
  name: string;
  description: string;
  icon?: string;
  created_at: string;
}

interface ActivityGridProps {
  activities: Activity[];
  onActivityLogged: () => void;
}

export default function ActivityGrid({ activities, onActivityLogged }: ActivityGridProps) {
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [logging, setLogging] = useState(false);
  const { showToast } = useToast();

  // Função para registrar participação
  const handleLogActivity = async (activityId: number) => {
    setSelectedActivityId(activityId);
    setLogging(true);
    const token = localStorage.getItem("token");
    
    try {
      const res = await fetch(`${API_BASE_URL}/activity/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activity_id: activityId }),
      });
      
      if (!res.ok) throw new Error();
      
      showToast("Atividade registrada com sucesso!", "success");
      onActivityLogged();
    } catch {
      showToast("Erro ao registrar atividade", "error");
    } finally {
      setLogging(false);
      setSelectedActivityId(null);
    }
  };

  // Ícones padrão para atividades comuns
  const getDefaultIcon = (name: string): string => {
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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
      {activities.map((activity) => (
        <button
          key={activity.id}
          onClick={() => handleLogActivity(activity.id)}
          disabled={logging && selectedActivityId === activity.id}
          className={`
            flex flex-col items-center justify-center p-4 rounded-lg shadow-md
            transition-all duration-200 hover:shadow-lg
            ${logging && selectedActivityId === activity.id ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'}
            border border-gray-200 h-32
          `}
        >
          <div className="text-3xl mb-2">
            {activity.icon || getDefaultIcon(activity.name)}
          </div>
          <div className="text-center font-medium text-sm">
            {activity.name}
          </div>
          {logging && selectedActivityId === activity.id && (
            <span className="loader mt-2"></span>
          )}
        </button>
      ))}
    </div>
  );
}
