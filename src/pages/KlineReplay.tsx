import React, { useEffect, useRef } from 'react';
import KlineChart from '../components/KlineChart';
import PlaybackControls from '../components/PlaybackControls';
import TimeSlider from '../components/TimeSlider';
import SettingsPanel from '../components/SettingsPanel';
import DataManager from '../components/DataManager';
import { useKlineReplayStore } from '../store';

const KlineReplay: React.FC = () => {
  const { playback, setCurrentIndex, klineData, settings, setPlaybackState } = useKlineReplayStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // 回放逻辑
  useEffect(() => {
    // 清除之前的定时器
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (playback.isPlaying && klineData) {
      intervalRef.current = setInterval(() => {
        const nextIndex = playback.currentIndex + 1;
        
        // 到达数据末尾时停止回放
        if (nextIndex >= klineData.candles.length) {
          setPlaybackState({ isPlaying: false });
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        } else {
          setCurrentIndex(nextIndex);
        }
      }, 1000 / settings.playbackSpeed);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [playback.isPlaying, playback.currentIndex, klineData, settings.playbackSpeed, setCurrentIndex, setPlaybackState]);
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">K线回放功能</h1>
          <p className="text-gray-400">专业的金融数据可视化工具，用于模拟和回放历史K线数据</p>
        </div>
        
        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧和中间区域 */}
          <div className="lg:col-span-2 space-y-6">
            {/* K线图表 */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <KlineChart />
            </div>
            
            {/* 时间轴 */}
            <TimeSlider />
            
            {/* 播放控制 */}
            <PlaybackControls />
          </div>
          
          {/* 右侧设置区域 */}
          <div className="space-y-6">
            {/* 数据管理 */}
            <DataManager />
            
            {/* 设置面板 */}
            <SettingsPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default KlineReplay;
