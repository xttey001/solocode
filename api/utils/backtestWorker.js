// 回测工作线程
self.onmessage = function(e) {
  const { candles, strategy, params, index } = e.data;
  
  try {
    let result;
    
    // 计算移动平均线
    function calculateMA(prices, period) {
      const n = prices.length;
      const ma = new Array(n).fill(0);
      const cumSum = new Array(n).fill(0);
      cumSum[0] = prices[0];
      for (let i = 1; i < n; i++) {
        cumSum[i] = cumSum[i - 1] + prices[i];
      }
      for (let i = period - 1; i < n; i++) {
        const sum = cumSum[i] - (i >= period ? cumSum[i - period] : 0);
        ma[i] = sum / period;
      }
      return ma;
    }
    
    // 计算RSI
    function calculateRSI(prices, period) {
      const n = prices.length;
      const rsi = new Array(n).fill(0);
      const gains = new Array(n).fill(0);
      const losses = new Array(n).fill(0);
      
      for (let i = 1; i < n; i++) {
        const change = prices[i] - prices[i - 1];
        gains[i] = Math.max(change, 0);
        losses[i] = Math.max(-change, 0);
      }
      
      let avgGain = 0;
      let avgLoss = 0;
      for (let i = 1; i <= period; i++) {
        avgGain += gains[i];
        avgLoss += losses[i];
      }
      avgGain /= period;
      avgLoss /= period;
      
      for (let i = period; i < n; i++) {
        avgGain = (avgGain * (period - 1) + gains[i]) / period;
        avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi[i] = 100 - (100 / (1 + rs));
      }
      
      return rsi;
    }
    
    // 计算EMA
    function calculateEMA(prices, period) {
      const n = prices.length;
      const ema = new Array(n).fill(0);
      const multiplier = 2 / (period + 1);
      
      let sum = 0;
      for (let i = 0; i < period; i++) {
        sum += prices[i];
      }
      ema[period - 1] = sum / period;
      
      for (let i = period; i < n; i++) {
        ema[i] = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
      }
      
      return ema;
    }
    
    // 计算MACD
    function calculateMACD(prices, fastPeriod, slowPeriod, signalPeriod) {
      const emaFast = calculateEMA(prices, fastPeriod);
      const emaSlow = calculateEMA(prices, slowPeriod);
      const n = prices.length;
      const macd = new Array(n).fill(0);
      const signal = new Array(n).fill(0);
      
      for (let i = 0; i < n; i++) {
        macd[i] = emaFast[i] - emaSlow[i];
      }
      
      const signalEma = calculateEMA(macd, signalPeriod);
      for (let i = 0; i < n; i++) {
        signal[i] = signalEma[i];
      }
      
      return { macd, signal };
    }
    
    // 计算夏普比率
    function calculateSharpeRatio(candles) {
      const n = candles.length;
      if (n < 2) return 0;
      
      const returns = new Array(n - 1);
      for (let i = 1; i < n; i++) {
        returns[i - 1] = (candles[i].close - candles[i-1].close) / candles[i-1].close;
      }
      
      const avgReturn = returns.reduce((sum, val) => sum + val, 0) / returns.length;
      const stdDev = Math.sqrt(returns.reduce((sum, val) => sum + Math.pow(val - avgReturn, 2), 0) / returns.length);
      
      return stdDev === 0 ? 0 : avgReturn / stdDev * Math.sqrt(252);
    }
    
    // 运行MA交叉策略
    function runMACrossoverStrategy(candles, params) {
      const shortPeriod = params.shortPeriod || 5;
      const longPeriod = params.longPeriod || 20;
      const prices = candles.map(c => c.close);
      const maShort = calculateMA(prices, shortPeriod);
      const maLong = calculateMA(prices, longPeriod);
      
      let position = 0;
      let entryPrice = 0;
      let trades = 0;
      let wins = 0;
      let totalReturn = 1;
      let maxReturn = 1;
      let maxDrawdown = 0;
      
      for (let i = longPeriod; i < candles.length; i++) {
        const currentPrice = candles[i].close;
        
        if (maShort[i] > maLong[i] && maShort[i-1] <= maLong[i-1] && position === 0) {
          position = 1;
          entryPrice = currentPrice;
          trades++;
        } else if (maShort[i] < maLong[i] && maShort[i-1] >= maLong[i-1] && position === 1) {
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
    
    // 运行RSI策略
    function runRSIStrategy(candles, params) {
      const period = params.period || 14;
      const overbought = params.overbought || 70;
      const oversold = params.oversold || 30;
      const prices = candles.map(c => c.close);
      const rsi = calculateRSI(prices, period);
      
      let position = 0;
      let entryPrice = 0;
      let trades = 0;
      let wins = 0;
      let totalReturn = 1;
      let maxReturn = 1;
      let maxDrawdown = 0;
      
      for (let i = period; i < candles.length; i++) {
        const currentPrice = candles[i].close;
        
        if (rsi[i] < oversold && position === 0) {
          position = 1;
          entryPrice = currentPrice;
          trades++;
        } else if (rsi[i] > overbought && position === 1) {
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
    
    // 运行MACD策略
    function runMACDStrategy(candles, params) {
      const fastPeriod = params.fastPeriod || 12;
      const slowPeriod = params.slowPeriod || 26;
      const signalPeriod = params.signalPeriod || 9;
      const prices = candles.map(c => c.close);
      const { macd, signal } = calculateMACD(prices, fastPeriod, slowPeriod, signalPeriod);
      
      let position = 0;
      let entryPrice = 0;
      let trades = 0;
      let wins = 0;
      let totalReturn = 1;
      let maxReturn = 1;
      let maxDrawdown = 0;
      
      for (let i = slowPeriod + signalPeriod; i < candles.length; i++) {
        const currentPrice = candles[i].close;
        
        if (macd[i] > signal[i] && macd[i-1] <= signal[i-1] && position === 0) {
          position = 1;
          entryPrice = currentPrice;
          trades++;
        } else if (macd[i] < signal[i] && macd[i-1] >= signal[i-1] && position === 1) {
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
    
    // 根据策略类型执行回测
    switch (strategy) {
      case 'ma_crossover':
        result = runMACrossoverStrategy(candles, params);
        break;
      case 'rsi_strategy':
        result = runRSIStrategy(candles, params);
        break;
      case 'macd_strategy':
        result = runMACDStrategy(candles, params);
        break;
      default:
        throw new Error('Invalid strategy');
    }
    
    self.postMessage({
      symbol: `stock_${index}`,
      strategy,
      ...result
    });
  } catch (error) {
    self.postMessage({
      symbol: `stock_${index}`,
      strategy,
      error: 'Failed to run backtest'
    });
  }
};