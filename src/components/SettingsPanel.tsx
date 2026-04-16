import React from 'react';
import { useKlineReplayStore } from '../store';

const SettingsPanel: React.FC = () => {
  const { settings, updateSettings, updateIndicator } = useKlineReplayStore();
  
  const handleIndicatorToggle = (name: string, enabled: boolean) => {
    updateIndicator(name, { enabled });
  };
  
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-white text-lg font-semibold mb-4">设置</h3>
      
      {/* 技术指标 */}
      <div className="mb-6">
        <h4 className="text-gray-300 text-sm font-medium mb-2">技术指标</h4>
        <div className="space-y-3">
          {settings.indicators.map((indicator) => (
            <div key={indicator.name} className="flex items-center justify-between">
              <span className="text-gray-300">{indicator.name}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={indicator.enabled}
                  onChange={(e) => handleIndicatorToggle(indicator.name, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* 显示设置 */}
      <div className="mb-6">
        <h4 className="text-gray-300 text-sm font-medium mb-2">显示设置</h4>
        <div className="flex items-center justify-between">
          <span className="text-gray-300">显示成交量</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showVolume}
              onChange={(e) => updateSettings({ showVolume: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
      
      {/* 时间范围 */}
      <div className="mb-6">
        <h4 className="text-gray-300 text-sm font-medium mb-2">时间范围</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-gray-400 text-xs mb-1">开始时间</label>
            <input
              type="datetime-local"
              value={settings.startTime.substring(0, 16)}
              onChange={(e) => updateSettings({ startTime: e.target.value + ':00.000Z' })}
              className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">结束时间</label>
            <input
              type="datetime-local"
              value={settings.endTime.substring(0, 16)}
              onChange={(e) => updateSettings({ endTime: e.target.value + ':00.000Z' })}
              className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
