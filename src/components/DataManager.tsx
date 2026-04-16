import React, { useRef } from 'react';
import { Upload, Download } from 'lucide-react';
import Papa from 'papaparse';
import { useKlineReplayStore } from '../store';
import { availableSymbols, availableIntervals } from '../data/sampleData';
import { KlineData, KlineCandle } from '../types';

const DataManager: React.FC = () => {
  const { settings, updateSettings, loadSampleData, importData, exportData } = useKlineReplayStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleSymbolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const symbol = e.target.value;
    updateSettings({ symbol });
    loadSampleData(symbol, settings.interval);
  };
  
  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const interval = e.target.value;
    updateSettings({ interval });
    loadSampleData(settings.symbol, interval);
  };
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        const candles: KlineCandle[] = results.data.map((row: any) => ({
          timestamp: row.timestamp,
          open: Number(row.open),
          high: Number(row.high),
          low: Number(row.low),
          close: Number(row.close),
          volume: Number(row.volume),
        }));
        
        if (candles.length > 0) {
          const klineData: KlineData = {
            symbol: 'Custom Data',
            interval: settings.interval,
            startTime: candles[0].timestamp,
            endTime: candles[candles.length - 1].timestamp,
            candles,
          };
          importData(klineData);
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
      },
    });
  };
  
  const handleExportClick = () => {
    const data = exportData();
    if (!data) return;
    
    const csv = Papa.unparse({
      fields: ['timestamp', 'open', 'high', 'low', 'close', 'volume'],
      data: data.candles,
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${data.symbol}_${data.interval}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-white text-lg font-semibold mb-4">数据管理</h3>
      
      {/* 数据源选择 */}
      <div className="mb-6">
        <h4 className="text-gray-300 text-sm font-medium mb-2">数据源</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-gray-400 text-xs mb-1">交易对</label>
            <select
              value={settings.symbol}
              onChange={handleSymbolChange}
              className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
            >
              {availableSymbols.map((symbol) => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">时间周期</label>
            <select
              value={settings.interval}
              onChange={handleIntervalChange}
              className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
            >
              {availableIntervals.map((interval) => (
                <option key={interval.value} value={interval.value}>{interval.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* 数据导入/导出 */}
      <div className="flex gap-3">
        <button
          onClick={handleImportClick}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors flex-1"
        >
          <Upload size={16} />
          导入数据
        </button>
        <button
          onClick={handleExportClick}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors flex-1"
        >
          <Download size={16} />
          导出数据
        </button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default DataManager;
