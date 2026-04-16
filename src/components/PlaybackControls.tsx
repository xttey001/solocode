import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useKlineReplayStore } from '../store';

const PlaybackControls: React.FC = () => {
  const { 
    playback, 
    togglePlayback, 
    resetPlayback, 
    settings, 
    updateSettings 
  } = useKlineReplayStore();
  
  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const speed = parseFloat(e.target.value);
    updateSettings({ playbackSpeed: speed });
  };
  
  return (
    <div className="bg-gray-800 p-4 rounded-lg flex items-center justify-between">
      {/* 播放控制按钮 */}
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlayback}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors"
          aria-label={playback.isPlaying ? '暂停' : '播放'}
        >
          {playback.isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        
        <button
          onClick={resetPlayback}
          className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full transition-colors"
          aria-label="重置"
        >
          <RotateCcw size={20} />
        </button>
      </div>
      
      {/* 时间信息 */}
      <div className="text-gray-300 text-sm">
        <span>{new Date(playback.currentTime).toLocaleString()}</span>
        <span className="mx-2">/</span>
        <span>{playback.currentIndex + 1} / {playback.totalCandles}</span>
      </div>
      
      {/* 速度调节 */}
      <div className="flex items-center gap-3">
        <span className="text-gray-300 text-sm">速度: {settings.playbackSpeed}x</span>
        <input
          type="range"
          min="0.5"
          max="10"
          step="0.5"
          value={settings.playbackSpeed}
          onChange={handleSpeedChange}
          className="w-40 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
};

export default PlaybackControls;
