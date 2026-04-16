import * as math from 'mathjs';

// 向量化回测引擎
class VectorizedBacktestEngine {
  // 计算移动平均线（优化版）
  static calculateMA(prices: number[], period: number): number[] {
    const n = prices.length;
    const ma: number[] = new Array(n).fill(0);
    
    // 预先计算累积和
    const cumSum = new Array(n).fill(0);
    cumSum[0] = prices[0];
    for (let i = 1; i < n; i++) {
      cumSum[i] = cumSum[i - 1] + prices[i];
    }
    
    // 计算移动平均
    for (let i = period - 1; i < n; i++) {
      const sum = cumSum[i] - (i >= period ? cumSum[i - period] : 0);
      ma[i] = sum / period;
    }
    
    return ma;
  }
  
  // 计算RSI（优化版）
  static calculateRSI(prices: number[], period: number): number[] {
    const n = prices.length;
    const rsi: number[] = new Array(n).fill(0);
    const gains: number[] = new Array(n).fill(0);
    const losses: number[] = new Array(n).fill(0);
    
    // 计算价格变化
    for (let i = 1; i < n; i++) {
      const change = prices[i] - prices[i - 1];
      gains[i] = Math.max(change, 0);
      losses[i] = Math.max(-change, 0);
    }
    
    // 计算初始平均增益和平均损失
    let avgGain = 0;
    let avgLoss = 0;
    for (let i = 1; i <= period; i++) {
      avgGain += gains[i];
      avgLoss += losses[i];
    }
    avgGain /= period;
    avgLoss /= period;
    
    // 计算RSI
    for (let i = period; i < n; i++) {
      // 使用平滑移动平均
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
      
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi[i] = 100 - (100 / (1 + rs));
    }
    
    return rsi;
  }
  
  // 计算MACD（优化版）
  static calculateMACD(prices: number[], fastPeriod: number, slowPeriod: number, signalPeriod: number): { macd: number[]; signal: number[] } {
    const emaFast = this.calculateEMA(prices, fastPeriod);
    const emaSlow = this.calculateEMA(prices, slowPeriod);
    const n = prices.length;
    const macd: number[] = new Array(n).fill(0);
    const signal: number[] = new Array(n).fill(0);
    
    // 计算MACD线
    for (let i = 0; i < n; i++) {
      macd[i] = emaFast[i] - emaSlow[i];
    }
    
    // 计算信号线（使用EMA）
    const signalEma = this.calculateEMA(macd, signalPeriod);
    for (let i = 0; i < n; i++) {
      signal[i] = signalEma[i];
    }
    
    return { macd, signal };
  }
  
  // 计算指数移动平均线（优化版）
  static calculateEMA(prices: number[], period: number): number[] {
    const n = prices.length;
    const ema: number[] = new Array(n).fill(0);
    const multiplier = 2 / (period + 1);
    
    // 计算第一个EMA（使用简单移动平均）
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += prices[i];
    }
    ema[period - 1] = sum / period;
    
    // 计算剩余的EMA
    for (let i = period; i < n; i++) {
      ema[i] = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
    }
    
    return ema;
  }
  
  // 运行MA交叉策略（优化版）
  static runMACrossoverStrategy(candles: any[], params: any) {
    const shortPeriod = params.shortPeriod || 5;
    const longPeriod = params.longPeriod || 20;
    
    // 提取收盘价
    const prices = candles.map(c => c.close);
    
    // 计算移动平均线
    const maShort = this.calculateMA(prices, shortPeriod);
    const maLong = this.calculateMA(prices, longPeriod);
    
    let position = 0; // 0: 空仓, 1: 持仓
    let entryPrice = 0;
    let trades = 0;
    let wins = 0;
    let totalReturn = 1;
    let maxReturn = 1;
    let maxDrawdown = 0;
    
    // 回测逻辑
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
    
    // 计算夏普比率
    const sharpeRatio = this.calculateSharpeRatio(candles);
    
    return {
      totalReturn: (totalReturn - 1) * 100,
      sharpeRatio,
      maxDrawdown: maxDrawdown * 100,
      trades,
      winRate: trades > 0 ? (wins / trades) * 100 : 0
    };
  }
  
  // 运行RSI策略（优化版）
  static runRSIStrategy(candles: any[], params: any) {
    const period = params.period || 14;
    const overbought = params.overbought || 70;
    const oversold = params.oversold || 30;
    
    // 提取收盘价
    const prices = candles.map(c => c.close);
    
    // 计算RSI
    const rsi = this.calculateRSI(prices, period);
    
    let position = 0;
    let entryPrice = 0;
    let trades = 0;
    let wins = 0;
    let totalReturn = 1;
    let maxReturn = 1;
    let maxDrawdown = 0;
    
    // 回测逻辑
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
    
    const sharpeRatio = this.calculateSharpeRatio(candles);
    
    return {
      totalReturn: (totalReturn - 1) * 100,
      sharpeRatio,
      maxDrawdown: maxDrawdown * 100,
      trades,
      winRate: trades > 0 ? (wins / trades) * 100 : 0
    };
  }
  
  // 运行MACD策略（优化版）
  static runMACDStrategy(candles: any[], params: any) {
    const fastPeriod = params.fastPeriod || 12;
    const slowPeriod = params.slowPeriod || 26;
    const signalPeriod = params.signalPeriod || 9;
    
    // 提取收盘价
    const prices = candles.map(c => c.close);
    
    // 计算MACD
    const { macd, signal } = this.calculateMACD(prices, fastPeriod, slowPeriod, signalPeriod);
    
    let position = 0;
    let entryPrice = 0;
    let trades = 0;
    let wins = 0;
    let totalReturn = 1;
    let maxReturn = 1;
    let maxDrawdown = 0;
    
    // 回测逻辑
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
    
    const sharpeRatio = this.calculateSharpeRatio(candles);
    
    return {
      totalReturn: (totalReturn - 1) * 100,
      sharpeRatio,
      maxDrawdown: maxDrawdown * 100,
      trades,
      winRate: trades > 0 ? (wins / trades) * 100 : 0
    };
  }
  
  // 计算夏普比率（优化版）
  static calculateSharpeRatio(candles: any[]) {
    const n = candles.length;
    if (n < 2) return 0;
    
    const returns: number[] = new Array(n - 1);
    
    for (let i = 1; i < n; i++) {
      returns[i - 1] = (candles[i].close - candles[i-1].close) / candles[i-1].close;
    }
    
    const avgReturn = math.mean(returns);
    const stdDev = math.std(returns);
    
    // 无风险利率假设为0
    return stdDev === 0 ? 0 : avgReturn / stdDev * Math.sqrt(252); // 年化
  }
  
  // 批量回测（优化版，支持并行处理和批处理）
  static async runBatchBacktest(symbols: string[], strategy: string, params: any, dataService: any) {
    const batchSize = 200; // 增加批处理大小以提高性能
    const results: any[] = [];
    const startTime = Date.now();
    
    // 分批处理
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      // 并行处理当前批次
      const batchResults = await Promise.all(
        batch.map(async (symbol) => {
          try {
            const data = await dataService.getDataFromCache(symbol, '1h');
            let result;
            
            switch (strategy) {
              case 'ma_crossover':
                result = this.runMACrossoverStrategy(data.candles, params);
                break;
              case 'rsi_strategy':
                result = this.runRSIStrategy(data.candles, params);
                break;
              case 'macd_strategy':
                result = this.runMACDStrategy(data.candles, params);
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
            return {
              symbol,
              strategy,
              error: 'Failed to run backtest'
            };
          }
        })
      );
      
      results.push(...batchResults);
      
      // 监控进度
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((i + batch.length) / symbols.length * 100));
      console.log(`Backtest progress: ${progress}%, Elapsed: ${(elapsed / 1000).toFixed(2)}s`);
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`Total backtest time: ${(totalTime / 1000).toFixed(2)}s for ${symbols.length} stocks`);
    
    return results;
  }
  
  // 向量化批量回测（使用矩阵操作和多线程）
  static runVectorizedBatchBacktest(candlesArray: any[][], strategy: string, params: any) {
    const results: any[] = [];
    const startTime = Date.now();
    
    // 使用工作线程池进行并行处理
    if (typeof Worker !== 'undefined') {
      // 浏览器环境下使用Web Workers
      return this.runWithWebWorkers(candlesArray, strategy, params);
    } else {
      // Node.js环境下使用worker_threads
      return this.runWithNodeWorkers(candlesArray, strategy, params);
    }
  }
  
  // 使用Web Workers进行并行处理
  static async runWithWebWorkers(candlesArray: any[][], strategy: string, params: any) {
    const results: any[] = [];
    const batchSize = 100;
    
    for (let i = 0; i < candlesArray.length; i += batchSize) {
      const batch = candlesArray.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((candles, index) => {
          return new Promise((resolve) => {
            const worker = new Worker('/api/utils/backtestWorker.js');
            worker.postMessage({ candles, strategy, params, index });
            worker.onmessage = (e) => {
              resolve(e.data);
              worker.terminate();
            };
            worker.onerror = () => {
              resolve({
                symbol: `stock_${i + index}`,
                strategy,
                error: 'Worker error'
              });
              worker.terminate();
            };
          });
        })
      );
      results.push(...batchResults);
    }
    
    return results;
  }
  
  // 使用Node.js worker_threads进行并行处理
  static async runWithNodeWorkers(candlesArray: any[][], strategy: string, params: any) {
    const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
    
    if (!isMainThread) {
      // 工作线程
      const { candles, strategy, params, index } = workerData;
      let result;
      
      try {
        switch (strategy) {
          case 'ma_crossover':
            result = VectorizedBacktestEngine.runMACrossoverStrategy(candles, params);
            break;
          case 'rsi_strategy':
            result = VectorizedBacktestEngine.runRSIStrategy(candles, params);
            break;
          case 'macd_strategy':
            result = VectorizedBacktestEngine.runMACDStrategy(candles, params);
            break;
          default:
            throw new Error('Invalid strategy');
        }
        
        parentPort.postMessage({
          symbol: `stock_${index}`,
          strategy,
          ...result
        });
      } catch (error) {
        parentPort.postMessage({
          symbol: `stock_${index}`,
          strategy,
          error: 'Failed to run backtest'
        });
      }
      return;
    }
    
    // 主线程
    const results: any[] = [];
    const batchSize = 100;
    
    for (let i = 0; i < candlesArray.length; i += batchSize) {
      const batch = candlesArray.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((candles, index) => {
          return new Promise((resolve) => {
            const worker = new Worker(__filename, {
              workerData: { candles, strategy, params, index: i + index }
            });
            worker.on('message', resolve);
            worker.on('error', () => {
              resolve({
                symbol: `stock_${i + index}`,
                strategy,
                error: 'Worker error'
              });
            });
            worker.on('exit', (code) => {
              if (code !== 0) {
                resolve({
                  symbol: `stock_${i + index}`,
                  strategy,
                  error: `Worker exited with code ${code}`
                });
              }
            });
          });
        })
      );
      results.push(...batchResults);
    }
    
    return results;
  }
  
  // 优化的批量数据处理
  static optimizeBatchProcessing(data: any[]) {
    // 使用TypedArray进行数据存储，减少内存使用
    const prices = new Float64Array(data.length);
    const timestamps = new Int64Array(data.length);
    
    for (let i = 0; i < data.length; i++) {
      prices[i] = data[i].close;
      timestamps[i] = new Date(data[i].timestamp).getTime();
    }
    
    return { prices, timestamps };
  }
  
  // 内存优化的技术指标计算
  static calculateIndicators(candles: any[], indicators: string[]) {
    const results: any = {};
    const prices = candles.map(c => c.close);
    
    // 批量计算所有指标，减少内存分配
    for (const indicator of indicators) {
      switch (indicator) {
        case 'MA5':
          results.MA5 = this.calculateMA(prices, 5);
          break;
        case 'MA20':
          results.MA20 = this.calculateMA(prices, 20);
          break;
        case 'MA50':
          results.MA50 = this.calculateMA(prices, 50);
          break;
        case 'RSI14':
          results.RSI14 = this.calculateRSI(prices, 14);
          break;
        case 'MACD':
          results.MACD = this.calculateMACD(prices, 12, 26, 9);
          break;
      }
    }
    
    return results;
  }
}

export default VectorizedBacktestEngine;