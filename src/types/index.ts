// K线数据结构
export interface KlineCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface KlineData {
  symbol: string;
  interval: string;
  startTime: string;
  endTime: string;
  candles: KlineCandle[];
}

// 技术指标配置
export interface TechnicalIndicator {
  name: string;
  parameters: Record<string, any>;
  enabled: boolean;
}

// 用户设置
export interface UserSettings {
  symbol: string;
  interval: string;
  startTime: string;
  endTime: string;
  playbackSpeed: number;
  showVolume: boolean;
  indicators: TechnicalIndicator[];
}

// 回放状态
export interface PlaybackState {
  isPlaying: boolean;
  currentIndex: number;
  totalCandles: number;
  currentTime: string;
  duration: number;
  speed: number;
}
