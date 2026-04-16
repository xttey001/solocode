import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface BacktestResult {
  symbol: string;
  strategy: string;
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  trades: number;
  winRate: number;
  error?: string;
}

interface BacktestResultsProps {
  results: BacktestResult[];
}

const BacktestResults: React.FC<BacktestResultsProps> = ({ results }) => {
  const [selectedResult, setSelectedResult] = useState<BacktestResult | null>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [tradeDistribution, setTradeDistribution] = useState<any[]>([]);

  useEffect(() => {
    if (results.length > 0) {
      setSelectedResult(results[0]);
      generatePerformanceData(results[0]);
      generateTradeDistribution(results[0]);
    }
  }, [results]);

  const generatePerformanceData = (result: BacktestResult) => {
    // 模拟性能数据
    const data = [];
    let value = 100;
    for (let i = 0; i < 30; i++) {
      value *= (1 + (Math.random() - 0.45) * 0.02);
      data.push({
        day: i + 1,
        value: parseFloat(value.toFixed(2))
      });
    }
    setPerformanceData(data);
  };

  const generateTradeDistribution = (result: BacktestResult) => {
    const winCount = Math.round(result.trades * (result.winRate / 100));
    const lossCount = result.trades - winCount;
    setTradeDistribution([
      { name: '盈利交易', value: winCount, color: '#48bb78' },
      { name: '亏损交易', value: lossCount, color: '#f56565' }
    ]);
  };

  const handleResultSelect = (result: BacktestResult) => {
    setSelectedResult(result);
    generatePerformanceData(result);
    generateTradeDistribution(result);
  };

  if (results.length === 0) {
    return (
      <div className="p-4 bg-gray-900 rounded-lg">
        <h2 className="text-xl font-bold text-white mb-4">回测结果</h2>
        <p className="text-gray-400">暂无回测结果</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-900 rounded-lg">
      <h2 className="text-xl font-bold text-white mb-4">回测结果</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* 结果列表 */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-2">回测列表</h3>
            <ul className="space-y-2">
              {results.map((result, index) => (
                <li 
                  key={index}
                  className={`p-3 rounded-md cursor-pointer transition-colors ${
                    selectedResult?.symbol === result.symbol ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  }`}
                  onClick={() => handleResultSelect(result)}
                >
                  <div className="font-medium">{result.symbol}</div>
                  <div className="text-sm">
                    {result.totalReturn >= 0 ? '+' : ''}{result.totalReturn.toFixed(2)}%
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* 性能指标 */}
        <div className="lg:col-span-2">
          {selectedResult && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                {selectedResult.symbol} - {selectedResult.strategy}
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="text-sm text-gray-400">总收益率</div>
                  <div className={`text-xl font-bold ${
                    selectedResult.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {selectedResult.totalReturn >= 0 ? '+' : ''}{selectedResult.totalReturn.toFixed(2)}%
                  </div>
                </div>
                
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="text-sm text-gray-400">夏普比率</div>
                  <div className={`text-xl font-bold ${
                    selectedResult.sharpeRatio >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {selectedResult.sharpeRatio.toFixed(2)}
                  </div>
                </div>
                
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="text-sm text-gray-400">最大回撤</div>
                  <div className="text-xl font-bold text-red-400">
                    {selectedResult.maxDrawdown.toFixed(2)}%
                  </div>
                </div>
                
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="text-sm text-gray-400">胜率</div>
                  <div className={`text-xl font-bold ${
                    selectedResult.winRate >= 50 ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {selectedResult.winRate.toFixed(2)}%
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 性能曲线 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">性能曲线</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="day" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#ffffff' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#3b82f6" 
                          strokeWidth={2} 
                          dot={false} 
                          activeDot={{ r: 6, fill: '#3b82f6' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* 交易分布 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">交易分布</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={tradeDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {tradeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#ffffff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-300 mb-2">详细信息</h4>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-400">交易次数</div>
                      <div className="text-lg font-medium text-white">{selectedResult.trades}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">策略</div>
                      <div className="text-lg font-medium text-white">{selectedResult.strategy}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 统计概览 */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">统计概览</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="text-sm text-gray-400">平均收益率</div>
            <div className={`text-xl font-bold ${
              results.reduce((sum, r) => sum + r.totalReturn, 0) / results.length >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {((results.reduce((sum, r) => sum + r.totalReturn, 0) / results.length).toFixed(2))}%
            </div>
          </div>
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="text-sm text-gray-400">平均夏普比率</div>
            <div className={`text-xl font-bold ${
              results.reduce((sum, r) => sum + r.sharpeRatio, 0) / results.length >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {(results.reduce((sum, r) => sum + r.sharpeRatio, 0) / results.length).toFixed(2)}
            </div>
          </div>
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="text-sm text-gray-400">平均最大回撤</div>
            <div className="text-xl font-bold text-red-400">
              {(results.reduce((sum, r) => sum + r.maxDrawdown, 0) / results.length).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BacktestResults;