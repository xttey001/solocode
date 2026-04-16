import VectorizedBacktestEngine from './vectorizedBacktest';
import { getDataFromCache, fetchDataFromAPI } from '../services/dataService';

// 生成模拟数据
function generateMockCandles(count: number) {
  const candles = [];
  const now = new Date();
  let price = 40000;
  
  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000).toISOString();
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
  
  return candles;
}

// 测试回测性能
async function testBacktestPerformance() {
  console.log('开始测试回测性能...');
  
  // 生成测试数据
  const testDataCount = 5000; // 5000只股票
  const candlesPerStock = 240; // 每只股票240根K线
  
  console.log(`准备 ${testDataCount} 只股票的测试数据...`);
  
  const testData = [];
  for (let i = 0; i < testDataCount; i++) {
    testData.push(generateMockCandles(candlesPerStock));
  }
  
  console.log('测试数据准备完成，开始回测...');
  
  // 测试MA交叉策略
  const startTime = Date.now();
  
  const results = VectorizedBacktestEngine.runVectorizedBatchBacktest(
    testData,
    'ma_crossover',
    { shortPeriod: 5, longPeriod: 20 }
  );
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`回测完成！`);
  console.log(`测试股票数量: ${testDataCount}`);
  console.log(`总耗时: ${duration} 毫秒`);
  console.log(`平均每只股票耗时: ${(duration / testDataCount).toFixed(2)} 毫秒`);
  console.log(`成功回测: ${results.filter(r => !r.error).length} 只`);
  console.log(`失败回测: ${results.filter(r => r.error).length} 只`);
  
  // 计算性能指标
  const successfulResults = results.filter(r => !r.error);
  if (successfulResults.length > 0) {
    const avgReturn = successfulResults.reduce((sum, r) => sum + r.totalReturn, 0) / successfulResults.length;
    const avgSharpe = successfulResults.reduce((sum, r) => sum + r.sharpeRatio, 0) / successfulResults.length;
    const avgDrawdown = successfulResults.reduce((sum, r) => sum + r.maxDrawdown, 0) / successfulResults.length;
    
    console.log(`\n性能指标:`);
    console.log(`平均收益率: ${avgReturn.toFixed(2)}%`);
    console.log(`平均夏普比率: ${avgSharpe.toFixed(2)}`);
    console.log(`平均最大回撤: ${avgDrawdown.toFixed(2)}%`);
  }
  
  return {
    duration,
    stockCount: testDataCount,
    successfulCount: successfulResults.length,
    failedCount: results.filter(r => r.error).length
  };
}

// 测试数据加载性能
async function testDataLoadingPerformance() {
  console.log('\n开始测试数据加载性能...');
  
  const testSymbols = [];
  for (let i = 0; i < 100; i++) {
    testSymbols.push(`TEST${i}`);
  }
  
  const startTime = Date.now();
  
  // 测试从缓存加载数据
  for (const symbol of testSymbols) {
    try {
      await getDataFromCache(symbol, '1h');
    } catch (error) {
      // 如果缓存不存在，从API获取
      await fetchDataFromAPI(symbol, '1h');
    }
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`数据加载完成！`);
  console.log(`测试股票数量: ${testSymbols.length}`);
  console.log(`总耗时: ${duration} 毫秒`);
  console.log(`平均每只股票耗时: ${(duration / testSymbols.length).toFixed(2)} 毫秒`);
  
  return {
    duration,
    symbolCount: testSymbols.length
  };
}

// 运行所有性能测试
async function runAllTests() {
  console.log('====================================');
  console.log('系统性能测试');
  console.log('====================================');
  
  const backtestResult = await testBacktestPerformance();
  const dataLoadingResult = await testDataLoadingPerformance();
  
  console.log('\n====================================');
  console.log('性能测试总结');
  console.log('====================================');
  console.log(`回测性能: ${backtestResult.stockCount}只股票耗时${backtestResult.duration}ms`);
  console.log(`数据加载性能: ${dataLoadingResult.symbolCount}只股票耗时${dataLoadingResult.duration}ms`);
  
  // 评估性能是否达标
  const backtestThreshold = 10000; // 10秒
  const dataLoadingThreshold = 5000; // 5秒
  
  console.log('\n性能评估:');
  if (backtestResult.duration < backtestThreshold) {
    console.log('✅ 回测性能达标: 5000只股票在10秒内完成');
  } else {
    console.log('❌ 回测性能未达标: 需要优化');
  }
  
  if (dataLoadingResult.duration < dataLoadingThreshold) {
    console.log('✅ 数据加载性能达标: 100只股票在5秒内完成');
  } else {
    console.log('❌ 数据加载性能未达标: 需要优化');
  }
}

// 运行测试
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { testBacktestPerformance, testDataLoadingPerformance, runAllTests };