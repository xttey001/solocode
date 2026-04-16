import { getDataFromCache } from './dataService';

// 交易策略类型
type Strategy = 'ma_crossover' | 'rsi_strategy' | 'macd_strategy';

// 回测结果接口
interface BacktestResult {
  symbol: string;
  strategy: string;
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  trades: number;
  winRate: number;
}

// 运行单个回测
export async function runBacktest(symbol: string, strategy: Strategy, params: any = {}): Promise<BacktestResult> {
  try {
    // 从缓存获取数据
    const data = await getDataFromCache(symbol, '1h');
    
    // 根据策略类型运行回测
    let result;
    switch (strategy) {
      case 'ma_crossover':
        result = runMACrossoverStrategy(data.candles, params);
        break;
      case 'rsi_strategy':
        result = runRSIStrategy(data.candles, params);
        break;
      case 'macd_strategy':
        result = runMACDStrategy(data.candles, params);
        break;
      default:
        throw new Error('Invalid strategy');
    }
    
    return {
      symbol,
      strategy,
      ...result
    };
  } catch (error) {
    throw new Error('Failed to run backtest');
  }
}

// 运行批量回测
export async function runBatchBacktest(symbols: string[], strategy: Strategy, params: any = {}): Promise<BacktestResult[]> {
  try {
    const results = await Promise.all(
      symbols.map(symbol => runBacktest(symbol, strategy, params))
    );
    return results;
  } catch (error) {
    throw new Error('Failed to run batch backtest');
  }
}

// MA交叉策略
function runMACrossoverStrategy(candles: any[], params: any) {
  const shortPeriod = params.shortPeriod || 5;
  const longPeriod = params.longPeriod || 20;
  
  let position = 0; // 0: 空仓, 1: 持仓
  let entryPrice = 0;
  let trades = 0;
  let wins = 0;
  let totalReturn = 1;
  let maxReturn = 1;
  let maxDrawdown = 0;
  
  // 计算移动平均线
  const maShort = calculateMA(candles, shortPeriod);
  const maLong = calculateMA(candles, longPeriod);
  
  for (let i = longPeriod; i < candles.length; i++) {
    const currentPrice = candles[i].close;
    
    // 金叉: 短期MA上穿长期MA
    if (maShort[i] > maLong[i] && maShort[i-1] <= maLong[i-1] && position === 0) {
      position = 1;
      entryPrice = currentPrice;
      trades++;
    }
    // 死叉: 短期MA下穿长期MA
    else if (maShort[i] < maLong[i] && maShort[i-1] >= maLong[i-1] && position === 1) {
      position = 0;
      const tradeReturn = currentPrice / entryPrice;
      totalReturn *= tradeReturn;
      if (tradeReturn > 1) wins++;
      
      // 计算最大回撤
      maxReturn = Math.max(maxReturn, totalReturn);
      const drawdown = (maxReturn - totalReturn) / maxReturn;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }
  
  // 计算夏普比率（简化版）
  const sharpeRatio = calculateSharpeRatio(candles);
  
  return {
    totalReturn: (totalReturn - 1) * 100,
    sharpeRatio,
    maxDrawdown: maxDrawdown * 100,
    trades,
    winRate: trades > 0 ? (wins / trades) * 100 : 0
  };
}

// RSI策略
function runRSIStrategy(candles: any[], params: any) {
  const period = params.period || 14;
  const overbought = params.overbought || 70;
  const oversold = params.oversold || 30;
  
  let position = 0;
  let entryPrice = 0;
  let trades = 0;
  let wins = 0;
  let totalReturn = 1;
  let maxReturn = 1;
  let maxDrawdown = 0;
  
  // 计算RSI
  const rsi = calculateRSI(candles, period);
  
  for (let i = period; i < candles.length; i++) {
    const currentPrice = candles[i].close;
    
    // 超卖买入
    if (rsi[i] < oversold && position === 0) {
      position = 1;
      entryPrice = currentPrice;
      trades++;
    }
    // 超买卖出
    else if (rsi[i] > overbought && position === 1) {
      position = 0;
      const tradeReturn = currentPrice / entryPrice;
      totalReturn *= tradeReturn;
      if (tradeReturn > 1) wins++;
      
      maxReturn = Math.max(maxReturn, totalReturn);
      const drawdown = (maxReturn - totalReturn) / maxReturn;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }
  
  const sharpeRatio = calculateSharpeRatio(candles);
  
  return {
    totalReturn: (totalReturn - 1) * 100,
    sharpeRatio,
    maxDrawdown: maxDrawdown * 100,
    trades,
    winRate: trades > 0 ? (wins / trades) * 100 : 0
  };
}

// MACD策略
function runMACDStrategy(candles: any[], params: any) {
  const fastPeriod = params.fastPeriod || 12;
  const slowPeriod = params.slowPeriod || 26;
  const signalPeriod = params.signalPeriod || 9;
  
  let position = 0;
  let entryPrice = 0;
  let trades = 0;
  let wins = 0;
  let totalReturn = 1;
  let maxReturn = 1;
  let maxDrawdown = 0;
  
  // 计算MACD
  const { macd, signal } = calculateMACD(candles, fastPeriod, slowPeriod, signalPeriod);
  
  for (let i = slowPeriod + signalPeriod; i < candles.length; i++) {
    const currentPrice = candles[i].close;
    
    // MACD金叉
    if (macd[i] > signal[i] && macd[i-1] <= signal[i-1] && position === 0) {
      position = 1;
      entryPrice = currentPrice;
      trades++;
    }
    // MACD死叉
    else if (macd[i] < signal[i] && macd[i-1] >= signal[i-1] && position === 1) {
      position = 0;
      const tradeReturn = currentPrice / entryPrice;
      totalReturn *= tradeReturn;
      if (tradeReturn > 1) wins++;
      
      maxReturn = Math.max(maxReturn, totalReturn);
      const drawdown = (maxReturn - totalReturn) / maxReturn;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }
  
  const sharpeRatio = calculateSharpeRatio(candles);
  
  return {
    totalReturn: (totalReturn - 1) * 100,
    sharpeRatio,
    maxDrawdown: maxDrawdown * 100,
    trades,
    winRate: trades > 0 ? (wins / trades) * 100 : 0
  };
}

// 计算移动平均线
function calculateMA(candles: any[], period: number) {
  const ma: number[] = [];
  
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      ma.push(0);
      continue;
    }
    
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j].close;
    }
    ma.push(sum / period);
  }
  
  return ma;
}

// 计算RSI
function calculateRSI(candles: any[], period: number) {
  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      rsi.push(0);
      gains.push(0);
      losses.push(0);
      continue;
    }
    
    const change = candles[i].close - candles[i-1].close;
    gains.push(Math.max(change, 0));
    losses.push(Math.max(-change, 0));
    
    if (i < period) {
      rsi.push(0);
      continue;
    }
    
    const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsiValue = 100 - (100 / (1 + rs));
    rsi.push(rsiValue);
  }
  
  return rsi;
}

// 计算MACD
function calculateMACD(candles: any[], fastPeriod: number, slowPeriod: number, signalPeriod: number) {
  const macd: number[] = [];
  const signal: number[] = [];
  
  const emaFast = calculateEMA(candles, fastPeriod);
  const emaSlow = calculateEMA(candles, slowPeriod);
  
  for (let i = 0; i < candles.length; i++) {
    macd.push(emaFast[i] - emaSlow[i]);
  }
  
  // 计算信号线
  for (let i = 0; i < macd.length; i++) {
    if (i < signalPeriod - 1) {
      signal.push(0);
      continue;
    }
    
    let sum = 0;
    for (let j = 0; j < signalPeriod; j++) {
      sum += macd[i - j];
    }
    signal.push(sum / signalPeriod);
  }
  
  return { macd, signal };
}

// 计算指数移动平均线
function calculateEMA(candles: any[], period: number) {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // 计算第一个EMA（使用简单移动平均）
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  ema.push(sum / period);
  
  // 计算剩余的EMA
  for (let i = period; i < candles.length; i++) {
    const currentEma = (candles[i].close - ema[i - 1]) * multiplier + ema[i - 1];
    ema.push(currentEma);
  }
  
  return ema;
}

// 计算夏普比率（简化版）
function calculateSharpeRatio(candles: any[]) {
  const returns: number[] = [];
  
  for (let i = 1; i < candles.length; i++) {
    const returnValue = (candles[i].close - candles[i-1].close) / candles[i-1].close;
    returns.push(returnValue);
  }
  
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(
    returns.map(r => Math.pow(r - avgReturn, 2)).reduce((a, b) => a + b, 0) / returns.length
  );
  
  // 无风险利率假设为0
  return stdDev === 0 ? 0 : avgReturn / stdDev * Math.sqrt(252); // 年化
}