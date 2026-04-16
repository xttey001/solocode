import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useKlineReplayStore } from '../store';

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const KlineChart: React.FC = () => {
  const { klineData, playback } = useKlineReplayStore();
  
  if (!klineData) return <div className="w-full h-[600px] bg-gray-900 rounded-lg flex items-center justify-center">加载中...</div>;
  
  // 获取当前回放位置的数据
  const currentData = klineData.candles.slice(0, playback.currentIndex + 1);
  
  // 准备图表数据
  const labels = currentData.map(candle => new Date(candle.timestamp).toLocaleDateString());
  const closePrices = currentData.map(candle => candle.close);
  const volumes = currentData.map(candle => candle.volume);
  
  // 蜡烛图数据（使用折线图模拟）
  const lineData = {
    labels,
    datasets: [{
      label: '收盘价',
      data: closePrices,
      borderColor: '#48bb78',
      backgroundColor: 'rgba(72, 187, 120, 0.1)',
      tension: 0.1,
      fill: true
    }]
  };
  
  // 成交量数据
  const barData = {
    labels,
    datasets: [{
      label: '成交量',
      data: volumes,
      backgroundColor: currentData.map(candle => candle.close >= candle.open ? '#48bb78' : '#f56565'),
    }]
  };
  
  // 图表配置
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#ffffff'
        }
      },
      title: {
        display: true,
        text: `${klineData.symbol} K线图表`,
        color: '#ffffff'
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#ffffff'
        },
        grid: {
          color: '#2d3748'
        }
      },
      y: {
        ticks: {
          color: '#ffffff'
        },
        grid: {
          color: '#2d3748'
        }
      }
    }
  };
  
  return (
    <div className="w-full space-y-4">
      {/* K线图表 */}
      <div className="w-full h-[400px] bg-gray-900 rounded-lg p-4">
        <Line data={lineData} options={chartOptions} />
      </div>
      
      {/* 成交量图表 */}
      <div className="w-full h-[200px] bg-gray-900 rounded-lg p-4">
        <Bar data={barData} options={chartOptions} />
      </div>
    </div>
  );
};

export default KlineChart;
