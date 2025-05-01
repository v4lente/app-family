"use client";
import { useEffect, useRef } from 'react';

interface StatsData {
  name: string;
  total: number;
}

interface StatsChartProps {
  data: StatsData[];
  title: string;
}

export default function StatsChart({ data, title }: StatsChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    // Encontrar o valor máximo para calcular as proporções
    const maxValue = Math.max(...data.map(item => item.total));
    
    // Limpar o conteúdo anterior
    chartRef.current.innerHTML = '';

    // Criar o gráfico
    data.forEach(item => {
      const percentage = (item.total / maxValue) * 100;
      
      // Container para cada barra
      const barContainer = document.createElement('div');
      barContainer.className = 'flex flex-col mb-4';
      
      // Informações do usuário e total
      const infoDiv = document.createElement('div');
      infoDiv.className = 'flex justify-between mb-1';
      
      const nameSpan = document.createElement('span');
      nameSpan.className = 'font-medium';
      nameSpan.textContent = item.name;
      
      const totalSpan = document.createElement('span');
      totalSpan.className = 'text-gray-600';
      totalSpan.textContent = `${item.total} atividades`;
      
      infoDiv.appendChild(nameSpan);
      infoDiv.appendChild(totalSpan);
      
      // Barra de progresso
      const progressContainer = document.createElement('div');
      progressContainer.className = 'w-full bg-gray-200 rounded-full h-4';
      
      const progressBar = document.createElement('div');
      progressBar.className = 'bg-blue-600 h-4 rounded-full transition-all duration-500';
      progressBar.style.width = '0%';
      
      progressContainer.appendChild(progressBar);
      
      // Adicionar elementos ao container
      barContainer.appendChild(infoDiv);
      barContainer.appendChild(progressContainer);
      
      // Adicionar ao gráfico
      chartRef.current?.appendChild(barContainer);
      
      // Animar a barra após um pequeno delay
      setTimeout(() => {
        progressBar.style.width = `${percentage}%`;
      }, 100);
    });
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <div ref={chartRef} className="mt-4"></div>
    </div>
  );
}
