import { KlineData } from '../types';

// 生成示例K线数据
const generateSampleData = (symbol: string, interval: string, count: number): KlineData => {
  const candles = [];
  const now = new Date();
  let price = 40000; // 初始价格
  
  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000).toISOString(); // 1小时间隔
    const open = price;
    const high = open + Math.random() * 1000;
    const low = open - Math.random() * 1000;
    const close = low + Math.random() * (high - low);
    const volume = Math.random() * 10000;
    
    price = close;
    
    candles.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume
    });
  }
  
  return {
    symbol,
    interval,
    startTime: candles[0].timestamp,
    endTime: candles[candles.length - 1].timestamp,
    candles
  };
};

// 示例数据
export const sampleData: Record<string, KlineData> = {
  'BTC/USDT_1h': generateSampleData('BTC/USDT', '1h', 240), // 10天数据
  'ETH/USDT_1h': generateSampleData('ETH/USDT', '1h', 240),
  'BTC/USDT_1d': generateSampleData('BTC/USDT', '1d', 365), // 1年数据
  'ETH/USDT_1d': generateSampleData('ETH/USDT', '1d', 365),
};

// 可用的交易对
export const availableSymbols = [
  'BTC/USDT',
  'ETH/USDT',
  'BNB/USDT',
  'SOL/USDT',
  'ADA/USDT'
];

// 可用的时间周期
export const availableIntervals = [
  { value: '1m', label: '1分钟' },
  { value: '5m', label: '5分钟' },
  { value: '15m', label: '15分钟' },
  { value: '1h', label: '1小时' },
  { value: '1d', label: '1天' }
];
