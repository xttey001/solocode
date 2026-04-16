import { create } from 'zustand';
import { KlineData, UserSettings, PlaybackState, TechnicalIndicator } from '../types';
import { sampleData } from '../data/sampleData';

interface KlineReplayStore {
  // 数据相关
  klineData: KlineData | null;
  setKlineData: (data: KlineData) => void;
  loadSampleData: (symbol: string, interval: string) => void;
  
  // 用户设置
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  
  // 回放状态
  playback: PlaybackState;
  setPlaybackState: (state: Partial<PlaybackState>) => void;
  togglePlayback: () => void;
  resetPlayback: () => void;
  setCurrentIndex: (index: number) => void;
  
  // 技术指标
  addIndicator: (indicator: TechnicalIndicator) => void;
  removeIndicator: (name: string) => void;
  updateIndicator: (name: string, updates: Partial<TechnicalIndicator>) => void;
  
  // 数据导入/导出
  importData: (data: KlineData) => void;
  exportData: () => KlineData | null;
}

const defaultIndicators: TechnicalIndicator[] = [
  { name: 'MA', parameters: { period: 20 }, enabled: true },
  { name: 'MACD', parameters: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 }, enabled: false },
  { name: 'RSI', parameters: { period: 14 }, enabled: false },
];

const initialSettings: UserSettings = {
  symbol: 'BTC/USDT',
  interval: '1h',
  startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天前
  endTime: new Date().toISOString(),
  playbackSpeed: 1,
  showVolume: true,
  indicators: defaultIndicators,
};

const initialPlayback: PlaybackState = {
  isPlaying: false,
  currentIndex: 0,
  totalCandles: 0,
  currentTime: '',
  duration: 0,
  speed: 1,
};

export const useKlineReplayStore = create<KlineReplayStore>((set, get) => ({
  // 数据相关
  klineData: sampleData['BTC/USDT_1h'],
  setKlineData: (data) => set({ klineData: data }),
  loadSampleData: (symbol, interval) => {
    const key = `${symbol}_${interval}`;
    const data = sampleData[key] || sampleData['BTC/USDT_1h'];
    set({ 
      klineData: data,
      playback: {
        ...initialPlayback,
        totalCandles: data.candles.length,
        currentTime: data.candles[0].timestamp,
      }
    });
  },
  
  // 用户设置
  settings: initialSettings,
  updateSettings: (updates) => set((state) => ({
    settings: { ...state.settings, ...updates }
  })),
  
  // 回放状态
  playback: {
    ...initialPlayback,
    totalCandles: sampleData['BTC/USDT_1h'].candles.length,
    currentTime: sampleData['BTC/USDT_1h'].candles[0].timestamp,
  },
  setPlaybackState: (updates) => set((state) => ({
    playback: { ...state.playback, ...updates }
  })),
  togglePlayback: () => set((state) => ({
    playback: { ...state.playback, isPlaying: !state.playback.isPlaying }
  })),
  resetPlayback: () => set((state) => ({
    playback: {
      ...initialPlayback,
      totalCandles: state.klineData?.candles.length || 0,
      currentTime: state.klineData?.candles[0].timestamp || '',
      speed: state.settings.playbackSpeed,
    }
  })),
  setCurrentIndex: (index) => set((state) => {
    const data = state.klineData;
    if (!data) return { playback: state.playback };
    
    const clampedIndex = Math.max(0, Math.min(index, data.candles.length - 1));
    return {
      playback: {
        ...state.playback,
        currentIndex: clampedIndex,
        currentTime: data.candles[clampedIndex].timestamp,
      }
    };
  }),
  
  // 技术指标
  addIndicator: (indicator) => set((state) => ({
    settings: {
      ...state.settings,
      indicators: [...state.settings.indicators, indicator]
    }
  })),
  removeIndicator: (name) => set((state) => ({
    settings: {
      ...state.settings,
      indicators: state.settings.indicators.filter(ind => ind.name !== name)
    }
  })),
  updateIndicator: (name, updates) => set((state) => ({
    settings: {
      ...state.settings,
      indicators: state.settings.indicators.map(ind => 
        ind.name === name ? { ...ind, ...updates } : ind
      )
    }
  })),
  
  // 数据导入/导出
  importData: (data) => set({ klineData: data }),
  exportData: () => get().klineData,
}));
