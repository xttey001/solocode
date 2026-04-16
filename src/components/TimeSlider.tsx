import React from 'react';
import { useKlineReplayStore } from '../store';

const TimeSlider: React.FC = () => {
  const { playback, setCurrentIndex, klineData } = useKlineReplayStore();
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    setCurrentIndex(index);
  };
  
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-300 text-sm">时间轴</span>
        <span className="text-gray-300 text-sm">
          {klineData ? new Date(klineData.candles[0].timestamp).toLocaleDateString() : ''} - 
          {klineData ? new Date(klineData.candles[klineData.candles.length - 1].timestamp).toLocaleDateString() : ''}
        </span>
      </div>
      <input
        type="range"
        min="0"
        max={playback.totalCandles - 1}
        value={playback.currentIndex}
        onChange={handleSliderChange}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>开始</span>
        <span>当前</span>
        <span>结束</span>
      </div>
    </div>
  );
};

export default TimeSlider;
