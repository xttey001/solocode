import Genetic from 'genetic-js';
import VectorizedBacktestEngine from './vectorizedBacktest';

// 因子接口
interface Factor {
  name: string;
  calculate: (candles: any[]) => number[] | { [key: string]: number[] };
  parameters: any;
}

// 因子库
class FactorLibrary {
  // 计算移动平均线
  static MA(candles: any[], period: number): number[] {
    const prices = candles.map(c => c.close);
    return VectorizedBacktestEngine.calculateMA(prices, period);
  }
  
  // 计算RSI
  static RSI(candles: any[], period: number): number[] {
    const prices = candles.map(c => c.close);
    return VectorizedBacktestEngine.calculateRSI(prices, period);
  }
  
  // 计算MACD
  static MACD(candles: any[], fastPeriod: number, slowPeriod: number, signalPeriod: number): { macd: number[]; signal: number[] } {
    const prices = candles.map(c => c.close);
    return VectorizedBacktestEngine.calculateMACD(prices, fastPeriod, slowPeriod, signalPeriod);
  }
  
  // 计算布林带
  static BollingerBands(candles: any[], period: number, stdDev: number): { upper: number[]; middle: number[]; lower: number[] } {
    const prices = candles.map(c => c.close);
    const ma = VectorizedBacktestEngine.calculateMA(prices, period);
    const upper: number[] = [];
    const lower: number[] = [];
    
    for (let i = 0; i < candles.length; i++) {
      if (i < period - 1) {
        upper.push(0);
        lower.push(0);
        continue;
      }
      
      // 计算标准差
      const window = prices.slice(i - period + 1, i + 1);
      const avg = ma[i];
      const variance = window.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / period;
      const std = Math.sqrt(variance);
      
      upper.push(avg + stdDev * std);
      lower.push(avg - stdDev * std);
    }
    
    return { upper, middle: ma, lower };
  }
  
  // 计算ATR (平均真实范围)
  static ATR(candles: any[], period: number): number[] {
    const atr: number[] = [];
    
    for (let i = 0; i < candles.length; i++) {
      if (i === 0) {
        atr.push(0);
        continue;
      }
      
      const trueRange = Math.max(
        candles[i].high - candles[i].low,
        Math.abs(candles[i].high - candles[i-1].close),
        Math.abs(candles[i].low - candles[i-1].close)
      );
      
      if (i < period) {
        atr.push(trueRange);
        continue;
      }
      
      const avgTrueRange = atr.slice(i - period + 1, i).reduce((sum, value) => sum + value, 0) / period;
      atr.push(avgTrueRange);
    }
    
    return atr;
  }
  
  // 计算动量
  static Momentum(candles: any[], period: number): number[] {
    const momentum: number[] = [];
    const prices = candles.map(c => c.close);
    
    for (let i = 0; i < candles.length; i++) {
      if (i < period) {
        momentum.push(0);
        continue;
      }
      
      momentum.push(prices[i] - prices[i - period]);
    }
    
    return momentum;
  }
  
  // 计算威廉指标
  static WilliamsR(candles: any[], period: number): number[] {
    const williamsR: number[] = [];
    
    for (let i = 0; i < candles.length; i++) {
      if (i < period - 1) {
        williamsR.push(0);
        continue;
      }
      
      // 计算周期内最高和最低价
      let highestHigh = -Infinity;
      let lowestLow = Infinity;
      
      for (let j = 0; j < period; j++) {
        highestHigh = Math.max(highestHigh, candles[i - j].high);
        lowestLow = Math.min(lowestLow, candles[i - j].low);
      }
      
      const currentClose = candles[i].close;
      const r = (highestHigh - currentClose) / (highestHigh - lowestLow) * -100;
      williamsR.push(r);
    }
    
    return williamsR;
  }
  
  // 计算随机指标
  static Stochastic(candles: any[], period: number): { k: number[]; d: number[] } {
    const k: number[] = [];
    const d: number[] = [];
    
    for (let i = 0; i < candles.length; i++) {
      if (i < period - 1) {
        k.push(0);
        d.push(0);
        continue;
      }
      
      // 计算周期内最高和最低价
      let highestHigh = -Infinity;
      let lowestLow = Infinity;
      
      for (let j = 0; j < period; j++) {
        highestHigh = Math.max(highestHigh, candles[i - j].high);
        lowestLow = Math.min(lowestLow, candles[i - j].low);
      }
      
      const currentClose = candles[i].close;
      const kValue = (currentClose - lowestLow) / (highestHigh - lowestLow) * 100;
      k.push(kValue);
      
      // 计算D线（3日移动平均）
      if (i >= period + 1) {
        const dValue = (k[i-2] + k[i-1] + k[i]) / 3;
        d.push(dValue);
      } else {
        d.push(0);
      }
    }
    
    return { k, d };
  }
  
  // 计算乖离率
  static BIAS(candles: any[], period: number): number[] {
    const bias: number[] = [];
    const prices = candles.map(c => c.close);
    const ma = VectorizedBacktestEngine.calculateMA(prices, period);
    
    for (let i = 0; i < candles.length; i++) {
      if (i < period - 1 || ma[i] === 0) {
        bias.push(0);
        continue;
      }
      
      bias.push((prices[i] - ma[i]) / ma[i] * 100);
    }
    
    return bias;
  }
}

// 遗传算法引擎
class GeneticAlgorithmEngine {
  // 生成初始种群
  static generateInitialPopulation(populationSize: number, factorCount: number) {
    const population: any[] = [];
    
    for (let i = 0; i < populationSize; i++) {
      const individual = {
        factors: [],
        fitness: 0
      };
      
      // 随机选择因子和参数
      for (let j = 0; j < factorCount; j++) {
        const factorType = Math.floor(Math.random() * 7); // 0: MA, 1: RSI, 2: MACD, 3: BollingerBands, 4: Momentum, 5: WilliamsR, 6: Stochastic
        
        switch (factorType) {
          case 0:
            individual.factors.push({
              type: 'MA',
              period: Math.floor(Math.random() * 50) + 5 // 5-55
            });
            break;
          case 1:
            individual.factors.push({
              type: 'RSI',
              period: Math.floor(Math.random() * 20) + 5 // 5-25
            });
            break;
          case 2:
            individual.factors.push({
              type: 'MACD',
              fastPeriod: Math.floor(Math.random() * 10) + 5, // 5-15
              slowPeriod: Math.floor(Math.random() * 20) + 15, // 15-35
              signalPeriod: Math.floor(Math.random() * 10) + 5 // 5-15
            });
            break;
          case 3:
            individual.factors.push({
              type: 'BollingerBands',
              period: Math.floor(Math.random() * 30) + 10, // 10-40
              stdDev: 1 + Math.random() * 2 // 1-3
            });
            break;
          case 4:
            individual.factors.push({
              type: 'Momentum',
              period: Math.floor(Math.random() * 20) + 5 // 5-25
            });
            break;
          case 5:
            individual.factors.push({
              type: 'WilliamsR',
              period: Math.floor(Math.random() * 20) + 5 // 5-25
            });
            break;
          case 6:
            individual.factors.push({
              type: 'Stochastic',
              period: Math.floor(Math.random() * 20) + 5 // 5-25
            });
            break;
        }
      }
      
      population.push(individual);
    }
    
    return population;
  }
  
  // 评估适应度
  static evaluateFitness(individual: any, candles: any[]) {
    try {
      // 基于因子组合构建策略
      let position = 0;
      let entryPrice = 0;
      let trades = 0;
      let wins = 0;
      let totalReturn = 1;
      let maxReturn = 1;
      let maxDrawdown = 0;
      
      // 计算所有因子值
      const factorValues: any = {};
      
      for (const factor of individual.factors) {
        switch (factor.type) {
          case 'MA':
            factorValues[`MA${factor.period}`] = FactorLibrary.MA(candles, factor.period);
            break;
          case 'RSI':
            factorValues[`RSI${factor.period}`] = FactorLibrary.RSI(candles, factor.period);
            break;
          case 'MACD':
            const macdResult = FactorLibrary.MACD(candles, factor.fastPeriod, factor.slowPeriod, factor.signalPeriod);
            factorValues[`MACD`] = macdResult.macd;
            factorValues[`MACDSignal`] = macdResult.signal;
            break;
          case 'BollingerBands':
            const bbResult = FactorLibrary.BollingerBands(candles, factor.period, factor.stdDev);
            factorValues[`BBUpper`] = bbResult.upper;
            factorValues[`BBMiddle`] = bbResult.middle;
            factorValues[`BBLower`] = bbResult.lower;
            break;
          case 'Momentum':
            factorValues[`Momentum${factor.period}`] = FactorLibrary.Momentum(candles, factor.period);
            break;
          case 'WilliamsR':
            factorValues[`WilliamsR${factor.period}`] = FactorLibrary.WilliamsR(candles, factor.period);
            break;
          case 'Stochastic':
            const stochasticResult = FactorLibrary.Stochastic(candles, factor.period);
            factorValues[`StochasticK${factor.period}`] = stochasticResult.k;
            factorValues[`StochasticD${factor.period}`] = stochasticResult.d;
            break;
          case 'BIAS':
            factorValues[`BIAS${factor.period}`] = FactorLibrary.BIAS(candles, factor.period);
            break;
        }
      }
      
      // 基于因子值生成交易信号
      for (let i = 20; i < candles.length; i++) {
        const currentPrice = candles[i].close;
        let buySignal = false;
        let sellSignal = false;
        let signalCount = 0;
        let buySignals = 0;
        let sellSignals = 0;
        
        // 基于多个因子的信号投票机制
        for (const factor of individual.factors) {
          switch (factor.type) {
            case 'MA':
              const ma = factorValues[`MA${factor.period}`];
              if (ma[i] > currentPrice * 0.995 && position === 0) {
                buySignals++;
                signalCount++;
              } else if (ma[i] < currentPrice * 1.005 && position === 1) {
                sellSignals++;
                signalCount++;
              }
              break;
            case 'RSI':
              const rsi = factorValues[`RSI${factor.period}`];
              if (rsi[i] < 30 && position === 0) {
                buySignals++;
                signalCount++;
              } else if (rsi[i] > 70 && position === 1) {
                sellSignals++;
                signalCount++;
              }
              break;
            case 'MACD':
              const macd = factorValues[`MACD`];
              const signal = factorValues[`MACDSignal`];
              if (macd[i] > signal[i] && macd[i-1] <= signal[i-1] && position === 0) {
                buySignals++;
                signalCount++;
              } else if (macd[i] < signal[i] && macd[i-1] >= signal[i-1] && position === 1) {
                sellSignals++;
                signalCount++;
              }
              break;
            case 'BollingerBands':
              const upper = factorValues[`BBUpper`];
              const lower = factorValues[`BBLower`];
              if (currentPrice < lower[i] && position === 0) {
                buySignals++;
                signalCount++;
              } else if (currentPrice > upper[i] && position === 1) {
                sellSignals++;
                signalCount++;
              }
              break;
            case 'Momentum':
              const momentum = factorValues[`Momentum${factor.period}`];
              if (momentum[i] > 0 && momentum[i-1] <= 0 && position === 0) {
                buySignals++;
                signalCount++;
              } else if (momentum[i] < 0 && momentum[i-1] >= 0 && position === 1) {
                sellSignals++;
                signalCount++;
              }
              break;
            case 'WilliamsR':
              const williamsR = factorValues[`WilliamsR${factor.period}`];
              if (williamsR[i] < -80 && position === 0) {
                buySignals++;
                signalCount++;
              } else if (williamsR[i] > -20 && position === 1) {
                sellSignals++;
                signalCount++;
              }
              break;
            case 'Stochastic':
              const stochasticK = factorValues[`StochasticK${factor.period}`];
              const stochasticD = factorValues[`StochasticD${factor.period}`];
              if (stochasticK[i] < 20 && stochasticD[i] < 20 && stochasticK[i] > stochasticD[i] && position === 0) {
                buySignals++;
                signalCount++;
              } else if (stochasticK[i] > 80 && stochasticD[i] > 80 && stochasticK[i] < stochasticD[i] && position === 1) {
                sellSignals++;
                signalCount++;
              }
              break;
          }
        }
        
        // 基于多数投票决定交易信号
        if (signalCount > 0) {
          if (buySignals > signalCount / 2) {
            buySignal = true;
          } else if (sellSignals > signalCount / 2) {
            sellSignal = true;
          }
        }
        
        // 执行交易
        if (buySignal) {
          position = 1;
          entryPrice = currentPrice;
          trades++;
        } else if (sellSignal) {
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
      
      // 计算适应度分数（考虑收益率、胜率和最大回撤）
      const winRate = trades > 0 ? wins / trades : 0;
      const sharpeRatio = VectorizedBacktestEngine.calculateSharpeRatio(candles);
      const fitness = (totalReturn - 1) * 100 * (1 + winRate) * (1 - maxDrawdown) * (1 + Math.abs(sharpeRatio) / 10);
      
      return fitness;
    } catch (error) {
      return 0;
    }
  }
  
  // 运行遗传算法
  static runGeneticAlgorithm(candles: any[], populationSize: number = 100, generations: number = 200, mutationRate: number = 0.15) {
    // 创建遗传算法实例
    const genetic = Genetic.create();
    
    // 配置遗传算法
    genetic.optimize = Genetic.Optimize.Maximize;
    genetic.select1 = Genetic.Select1.Tournament2;
    genetic.select2 = Genetic.Select2.Tournament2;
    
    // 初始化种群
    genetic.seed = () => {
      const individual = {
        factors: [],
        fitness: 0
      };
      
      // 随机选择2-5个因子
      const factorCount = Math.floor(Math.random() * 4) + 2;
      
      for (let i = 0; i < factorCount; i++) {
        const factorType = Math.floor(Math.random() * 7);
        
        switch (factorType) {
          case 0:
            individual.factors.push({
              type: 'MA',
              period: Math.floor(Math.random() * 50) + 5
            });
            break;
          case 1:
            individual.factors.push({
              type: 'RSI',
              period: Math.floor(Math.random() * 20) + 5
            });
            break;
          case 2:
            individual.factors.push({
              type: 'MACD',
              fastPeriod: Math.floor(Math.random() * 10) + 5,
              slowPeriod: Math.floor(Math.random() * 20) + 15,
              signalPeriod: Math.floor(Math.random() * 10) + 5
            });
            break;
          case 3:
            individual.factors.push({
              type: 'BollingerBands',
              period: Math.floor(Math.random() * 30) + 10,
              stdDev: 1 + Math.random() * 2
            });
            break;
          case 4:
            individual.factors.push({
              type: 'Momentum',
              period: Math.floor(Math.random() * 20) + 5
            });
            break;
          case 5:
            individual.factors.push({
              type: 'WilliamsR',
              period: Math.floor(Math.random() * 20) + 5
            });
            break;
          case 6:
            individual.factors.push({
              type: 'Stochastic',
              period: Math.floor(Math.random() * 20) + 5
            });
            break;
        }
      }
      
      return individual;
    };
    
    // 适应度函数
    genetic.fitness = (individual: any) => {
      return this.evaluateFitness(individual, candles);
    };
    
    // 突变函数
    genetic.mutate = (individual: any) => {
      if (Math.random() < mutationRate) {
        const mutationType = Math.floor(Math.random() * 3); // 0: 修改参数, 1: 添加因子, 2: 删除因子
        
        switch (mutationType) {
          case 0:
            // 修改现有因子参数
            if (individual.factors.length > 0) {
              const factorIndex = Math.floor(Math.random() * individual.factors.length);
              const factor = individual.factors[factorIndex];
              
              switch (factor.type) {
                case 'MA':
                  factor.period = Math.floor(Math.random() * 50) + 5;
                  break;
                case 'RSI':
                  factor.period = Math.floor(Math.random() * 20) + 5;
                  break;
                case 'MACD':
                  factor.fastPeriod = Math.floor(Math.random() * 10) + 5;
                  factor.slowPeriod = Math.floor(Math.random() * 20) + 15;
                  factor.signalPeriod = Math.floor(Math.random() * 10) + 5;
                  break;
                case 'BollingerBands':
                  factor.period = Math.floor(Math.random() * 30) + 10;
                  factor.stdDev = 1 + Math.random() * 2;
                  break;
                case 'Momentum':
                  factor.period = Math.floor(Math.random() * 20) + 5;
                  break;
                case 'WilliamsR':
                  factor.period = Math.floor(Math.random() * 20) + 5;
                  break;
                case 'Stochastic':
                  factor.period = Math.floor(Math.random() * 20) + 5;
                  break;
              }
            }
            break;
          case 1:
            // 添加新因子
            if (individual.factors.length < 5) {
              const factorType = Math.floor(Math.random() * 7);
              
              switch (factorType) {
                case 0:
                  individual.factors.push({
                    type: 'MA',
                    period: Math.floor(Math.random() * 50) + 5
                  });
                  break;
                case 1:
                  individual.factors.push({
                    type: 'RSI',
                    period: Math.floor(Math.random() * 20) + 5
                  });
                  break;
                case 2:
                  individual.factors.push({
                    type: 'MACD',
                    fastPeriod: Math.floor(Math.random() * 10) + 5,
                    slowPeriod: Math.floor(Math.random() * 20) + 15,
                    signalPeriod: Math.floor(Math.random() * 10) + 5
                  });
                  break;
                case 3:
                  individual.factors.push({
                    type: 'BollingerBands',
                    period: Math.floor(Math.random() * 30) + 10,
                    stdDev: 1 + Math.random() * 2
                  });
                  break;
                case 4:
                  individual.factors.push({
                    type: 'Momentum',
                    period: Math.floor(Math.random() * 20) + 5
                  });
                  break;
                case 5:
                  individual.factors.push({
                    type: 'WilliamsR',
                    period: Math.floor(Math.random() * 20) + 5
                  });
                  break;
                case 6:
                  individual.factors.push({
                    type: 'Stochastic',
                    period: Math.floor(Math.random() * 20) + 5
                  });
                  break;
              }
            }
            break;
          case 2:
            // 删除因子
            if (individual.factors.length > 1) {
              const factorIndex = Math.floor(Math.random() * individual.factors.length);
              individual.factors.splice(factorIndex, 1);
            }
            break;
        }
      }
      return individual;
    };
    
    // 交叉函数
    genetic.crossover = (mother: any, father: any) => {
      const child = {
        factors: [],
        fitness: 0
      };
      
      // 均匀交叉
      const maxLength = Math.max(mother.factors.length, father.factors.length);
      
      for (let i = 0; i < maxLength; i++) {
        if (i < mother.factors.length && i < father.factors.length) {
          // 随机选择父母的因子
          child.factors.push(Math.random() < 0.5 ? mother.factors[i] : father.factors[i]);
        } else if (i < mother.factors.length) {
          // 从母亲继承
          child.factors.push(mother.factors[i]);
        } else {
          // 从父亲继承
          child.factors.push(father.factors[i]);
        }
      }
      
      // 限制因子数量在合理范围内
      if (child.factors.length > 5) {
        child.factors = child.factors.slice(0, 5);
      } else if (child.factors.length < 1) {
        // 确保至少有一个因子
        const factorType = Math.floor(Math.random() * 7);
        switch (factorType) {
          case 0:
            child.factors.push({ type: 'MA', period: 20 });
            break;
          case 1:
            child.factors.push({ type: 'RSI', period: 14 });
            break;
          case 2:
            child.factors.push({ type: 'MACD', fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 });
            break;
          default:
            child.factors.push({ type: 'MA', period: 20 });
        }
      }
      
      return child;
    };
    
    // 运行遗传算法
    const population = genetic.evolve({
      size: populationSize,
      generations: generations,
      mutation: mutationRate,
      crossover: 0.6
    });
    
    // 返回最佳个体
    return population[0];
  }
  
  // 因子评估
  static evaluateFactors(candles: any[]) {
    const factors = [
      { name: 'MA5', calculate: (c) => FactorLibrary.MA(c, 5) },
      { name: 'MA20', calculate: (c) => FactorLibrary.MA(c, 20) },
      { name: 'MA50', calculate: (c) => FactorLibrary.MA(c, 50) },
      { name: 'RSI14', calculate: (c) => FactorLibrary.RSI(c, 14) },
      { name: 'ATR14', calculate: (c) => FactorLibrary.ATR(c, 14) },
      { name: 'Momentum10', calculate: (c) => FactorLibrary.Momentum(c, 10) },
      { name: 'WilliamsR14', calculate: (c) => FactorLibrary.WilliamsR(c, 14) },
      { name: 'Stochastic14', calculate: (c) => FactorLibrary.Stochastic(c, 14).k },
      { name: 'BIAS10', calculate: (c) => FactorLibrary.BIAS(c, 10) }
    ];
    
    const results = [];
    
    for (const factor of factors) {
      const values = factor.calculate(candles);
      
      // 计算因子与价格的相关性
      const prices = candles.map(c => c.close);
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumX2 = 0;
      let sumY2 = 0;
      let n = 0;
      
      for (let i = 0; i < candles.length; i++) {
        if (values[i] > 0 || values[i] < 0) { // 排除0值
          sumX += values[i];
          sumY += prices[i];
          sumXY += values[i] * prices[i];
          sumX2 += values[i] * values[i];
          sumY2 += prices[i] * prices[i];
          n++;
        }
      }
      
      let correlation = 0;
      if (n > 0) {
        const denominator = Math.sqrt((sumX2 - sumX * sumX / n) * (sumY2 - sumY * sumY / n));
        if (denominator > 0) {
          correlation = (sumXY - sumX * sumY / n) / denominator;
        }
      }
      
      // 计算因子的信息比率（简化版）
      const returns: number[] = [];
      for (let i = 1; i < candles.length; i++) {
        returns.push((candles[i].close - candles[i-1].close) / candles[i-1].close);
      }
      
      const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const stdDev = Math.sqrt(returns.map(r => Math.pow(r - avgReturn, 2)).reduce((a, b) => a + b, 0) / returns.length);
      const informationRatio = stdDev === 0 ? 0 : Math.abs(correlation) * (avgReturn / stdDev);
      
      results.push({
        name: factor.name,
        correlation: correlation,
        informationRatio: informationRatio,
        values: values
      });
    }
    
    // 按信息比率排序
    results.sort((a, b) => b.informationRatio - a.informationRatio);
    
    return results;
  }
  
  // 因子组合评估
  static evaluateFactorCombination(candles: any[], factors: any[]) {
    try {
      // 计算所有因子值
      const factorValues: any = {};
      
      for (const factor of factors) {
        switch (factor.type) {
          case 'MA':
            factorValues[`MA${factor.period}`] = FactorLibrary.MA(candles, factor.period);
            break;
          case 'RSI':
            factorValues[`RSI${factor.period}`] = FactorLibrary.RSI(candles, factor.period);
            break;
          case 'MACD':
            const macdResult = FactorLibrary.MACD(candles, factor.fastPeriod, factor.slowPeriod, factor.signalPeriod);
            factorValues[`MACD`] = macdResult.macd;
            factorValues[`MACDSignal`] = macdResult.signal;
            break;
          case 'BollingerBands':
            const bbResult = FactorLibrary.BollingerBands(candles, factor.period, factor.stdDev);
            factorValues[`BBUpper`] = bbResult.upper;
            factorValues[`BBMiddle`] = bbResult.middle;
            factorValues[`BBLower`] = bbResult.lower;
            break;
          case 'Momentum':
            factorValues[`Momentum${factor.period}`] = FactorLibrary.Momentum(candles, factor.period);
            break;
          case 'WilliamsR':
            factorValues[`WilliamsR${factor.period}`] = FactorLibrary.WilliamsR(candles, factor.period);
            break;
          case 'Stochastic':
            const stochasticResult = FactorLibrary.Stochastic(candles, factor.period);
            factorValues[`StochasticK${factor.period}`] = stochasticResult.k;
            factorValues[`StochasticD${factor.period}`] = stochasticResult.d;
            break;
        }
      }
      
      // 回测策略
      let position = 0;
      let entryPrice = 0;
      let trades = 0;
      let wins = 0;
      let totalReturn = 1;
      let maxReturn = 1;
      let maxDrawdown = 0;
      
      for (let i = 20; i < candles.length; i++) {
        const currentPrice = candles[i].close;
        let buySignal = false;
        let sellSignal = false;
        let signalCount = 0;
        let buySignals = 0;
        let sellSignals = 0;
        
        // 基于多个因子的信号投票机制
        for (const factor of factors) {
          switch (factor.type) {
            case 'MA':
              const ma = factorValues[`MA${factor.period}`];
              if (ma[i] > currentPrice * 0.995 && position === 0) {
                buySignals++;
                signalCount++;
              } else if (ma[i] < currentPrice * 1.005 && position === 1) {
                sellSignals++;
                signalCount++;
              }
              break;
            case 'RSI':
              const rsi = factorValues[`RSI${factor.period}`];
              if (rsi[i] < 30 && position === 0) {
                buySignals++;
                signalCount++;
              } else if (rsi[i] > 70 && position === 1) {
                sellSignals++;
                signalCount++;
              }
              break;
            case 'MACD':
              const macd = factorValues[`MACD`];
              const signal = factorValues[`MACDSignal`];
              if (macd[i] > signal[i] && macd[i-1] <= signal[i-1] && position === 0) {
                buySignals++;
                signalCount++;
              } else if (macd[i] < signal[i] && macd[i-1] >= signal[i-1] && position === 1) {
                sellSignals++;
                signalCount++;
              }
              break;
            case 'BollingerBands':
              const upper = factorValues[`BBUpper`];
              const lower = factorValues[`BBLower`];
              if (currentPrice < lower[i] && position === 0) {
                buySignals++;
                signalCount++;
              } else if (currentPrice > upper[i] && position === 1) {
                sellSignals++;
                signalCount++;
              }
              break;
            case 'Momentum':
              const momentum = factorValues[`Momentum${factor.period}`];
              if (momentum[i] > 0 && momentum[i-1] <= 0 && position === 0) {
                buySignals++;
                signalCount++;
              } else if (momentum[i] < 0 && momentum[i-1] >= 0 && position === 1) {
                sellSignals++;
                signalCount++;
              }
              break;
            case 'WilliamsR':
              const williamsR = factorValues[`WilliamsR${factor.period}`];
              if (williamsR[i] < -80 && position === 0) {
                buySignals++;
                signalCount++;
              } else if (williamsR[i] > -20 && position === 1) {
                sellSignals++;
                signalCount++;
              }
              break;
            case 'Stochastic':
              const stochasticK = factorValues[`StochasticK${factor.period}`];
              const stochasticD = factorValues[`StochasticD${factor.period}`];
              if (stochasticK[i] < 20 && stochasticD[i] < 20 && stochasticK[i] > stochasticD[i] && position === 0) {
                buySignals++;
                signalCount++;
              } else if (stochasticK[i] > 80 && stochasticD[i] > 80 && stochasticK[i] < stochasticD[i] && position === 1) {
                sellSignals++;
                signalCount++;
              }
              break;
          }
        }
        
        // 基于多数投票决定交易信号
        if (signalCount > 0) {
          if (buySignals > signalCount / 2) {
            buySignal = true;
          } else if (sellSignals > signalCount / 2) {
            sellSignal = true;
          }
        }
        
        // 执行交易
        if (buySignal) {
          position = 1;
          entryPrice = currentPrice;
          trades++;
        } else if (sellSignal) {
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
      
      // 计算性能指标
      const winRate = trades > 0 ? wins / trades : 0;
      const sharpeRatio = VectorizedBacktestEngine.calculateSharpeRatio(candles);
      
      return {
        totalReturn: (totalReturn - 1) * 100,
        sharpeRatio,
        maxDrawdown: maxDrawdown * 100,
        trades,
        winRate: winRate * 100,
        factors: factors
      };
    } catch (error) {
      return {
        totalReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        trades: 0,
        winRate: 0,
        factors: factors,
        error: 'Failed to evaluate factor combination'
      };
    }
  }
  
  // 因子重要性分析
  static analyzeFactorImportance(candles: any[]) {
    const baseFactors = [
      { type: 'MA', period: 20 },
      { type: 'RSI', period: 14 },
      { type: 'MACD', fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
      { type: 'BollingerBands', period: 20, stdDev: 2 },
      { type: 'Momentum', period: 10 },
      { type: 'WilliamsR', period: 14 },
      { type: 'Stochastic', period: 14 }
    ];
    
    const importanceScores: any[] = [];
    
    // 评估每个因子单独使用时的性能
    for (const factor of baseFactors) {
      const result = this.evaluateFactorCombination(candles, [factor]);
      importanceScores.push({
        factor: factor,
        score: result.totalReturn * (1 - result.maxDrawdown / 100) * (1 + result.sharpeRatio / 10)
      });
    }
    
    // 按重要性排序
    importanceScores.sort((a, b) => b.score - a.score);
    
    return importanceScores;
  }
}

export { GeneticAlgorithmEngine, FactorLibrary };