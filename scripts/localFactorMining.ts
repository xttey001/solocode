import fs from 'fs';
import path from 'path';
import { GeneticAlgorithmEngine, FactorLibrary } from '../api/utils/geneticAlgorithm';
import { batchGetDataFromCache } from '../api/services/dataService';

let currentConfig: ScriptConfig = DEFAULT_CONFIG;

// 脚本配置接口
interface ScriptConfig {
  interval: string;
  populationSize: number;
  generations: number;
  mutationRate: number;
  batchSize: number;
  outputDir: string;
  cacheDir: string;
  symbols?: string[] | null;
}

// 默认配置
const DEFAULT_CONFIG: ScriptConfig = {
  interval: '1h',
  populationSize: 100,
  generations: 200,
  mutationRate: 0.15,
  batchSize: 50,
  outputDir: path.join(__dirname, '../mining_results'),
  cacheDir: path.join(__dirname, '../cache_data'),
  symbols: null
};

// 股票列表生成器（示例）
function generateStockList(count: number = 5000): string[] {
  const symbols: string[] = [];
  
  for (let i = 1; i <= count; i++) {
    const code = String(i).padStart(6, '0');
    symbols.push(code);
  }
  
  return symbols;
}

// 从本地缓存目录获取实际股票列表
function getStockListFromCache(cacheDir: string): string[] {
  const symbols: string[] = [];
  
  if (!fs.existsSync(cacheDir)) {
    console.warn(`Cache directory ${cacheDir} not found, generating dummy stock list`);
    return generateStockList(100);
  }
  
  const files = fs.readdirSync(cacheDir);
  
  for (const file of files) {
    if (file.endsWith('.parquet')) {
      const parts = file.replace('.parquet', '').split('_');
      if (parts.length >= 2) {
        const symbol = parts.slice(0, -1).join('_');
        if (!symbols.includes(symbol)) {
          symbols.push(symbol);
        }
      }
    }
  }
  
  return symbols;
}

// 确保输出目录存在
function ensureOutputDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 保存结果到文件
function saveResults(results: any[], filename: string, outputDir: string) {
  const filePath = path.join(outputDir, filename);
  const data = JSON.stringify(results, null, 2);
  fs.writeFileSync(filePath, data);
  console.log(`Results saved to ${filePath}`);
}

// 单只股票的因子挖掘
async function mineSingleStock(symbol: string, interval: string, config?: ScriptConfig): Promise<any> {
  try {
    const effectiveConfig = config || getConfig();
    console.log(`Mining factors for ${symbol}...`);
    
    const dataResults = await batchGetDataFromCache([symbol], interval);
    
    if (!dataResults || dataResults.length === 0) {
      console.warn(`No data found for ${symbol}`);
      return {
        symbol,
        success: false,
        error: 'No data found'
      };
    }
    
    const candles = dataResults[0].candles;
    
    // 评估单个因子
    const factorEvaluations = GeneticAlgorithmEngine.evaluateFactors(candles);
    
    // 分析因子重要性
    const factorImportance = GeneticAlgorithmEngine.analyzeFactorImportance(candles);
    
    // 运行遗传算法
    const bestIndividual = GeneticAlgorithmEngine.runGeneticAlgorithm(
      candles,
      effectiveConfig.populationSize,
      effectiveConfig.generations,
      effectiveConfig.mutationRate
    );
    
    // 评估最佳因子组合
    const combinationEvaluation = GeneticAlgorithmEngine.evaluateFactorCombination(
      candles,
      bestIndividual.factors
    );
    
    return {
      symbol,
      success: true,
      factorEvaluations: factorEvaluations.slice(0, 10),
      factorImportance,
      bestIndividual: {
        factors: bestIndividual.factors,
        fitness: bestIndividual.fitness
      },
      combinationEvaluation
    };
  } catch (error) {
    console.error(`Error mining factors for ${symbol}:`, error);
    return {
      symbol,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// 批量因子挖掘
async function batchFactorMining(symbols: string[], config?: ScriptConfig): Promise<any[]> {
  const results: any[] = [];
  const total = symbols.length;
  const effectiveConfig = config || getConfig();
  
  console.log(`Starting batch factor mining for ${total} stocks...`);
  console.log(`Configuration: ${JSON.stringify(effectiveConfig, null, 2)}`);
  
  const startTime = Date.now();
  
  for (let i = 0; i < symbols.length; i += effectiveConfig.batchSize) {
    const batch = symbols.slice(i, i + effectiveConfig.batchSize);
    const batchNum = Math.floor(i / effectiveConfig.batchSize) + 1;
    const totalBatches = Math.ceil(symbols.length / effectiveConfig.batchSize);
    
    console.log(`\nProcessing batch ${batchNum}/${totalBatches} (${batch.length} stocks)`);
    
    const batchResults = await Promise.all(
      batch.map(symbol => mineSingleStock(symbol, effectiveConfig.interval, effectiveConfig))
    );
    
    results.push(...batchResults);
    
    const progress = ((i + batch.length) / total * 100).toFixed(2);
    console.log(`Progress: ${progress}% (${i + batch.length}/${total})`);
    
    if (batchResults.length > 0) {
      const successCount = batchResults.filter(r => r.success).length;
      console.log(`Success rate in this batch: ${(successCount / batch.length * 100).toFixed(2)}%`);
    }
  }
  
  const elapsed = Date.now() - startTime;
  console.log(`\nBatch factor mining completed in ${(elapsed / 1000).toFixed(2)} seconds`);
  
  return results;
}

// 设置当前配置
function setConfig(config: ScriptConfig) {
  currentConfig = { ...config };
}

// 获取当前配置
function getConfig(): ScriptConfig {
  return currentConfig;
}

// 主函数
async function main() {
  console.log('========================================');
  console.log('  Local Factor Mining & Genetic Algorithm');
  console.log('========================================\n');
  
  if (process.env.MINING_CONFIG) {
    try {
      const envConfig = JSON.parse(process.env.MINING_CONFIG);
      setConfig(envConfig);
    } catch (error) {
      console.warn('Failed to parse config from environment, using defaults');
    }
  }
  
  const config = getConfig();
  ensureOutputDir(config.outputDir);
  
  let symbols: string[];
  if (config.symbols && Array.isArray(config.symbols)) {
    symbols = config.symbols;
  } else {
    symbols = getStockListFromCache(config.cacheDir);
  }
  
  if (symbols.length === 0) {
    console.error('No symbols found in cache. Please ensure cache data is available.');
    return;
  }
  
  console.log(`Found ${symbols.length} symbols in cache`);
  
  const results = await batchFactorMining(symbols, config);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  saveResults(results, `mining_results_${timestamp}.json`, config.outputDir);
  
  const successResults = results.filter(r => r.success);
  const failedResults = results.filter(r => !r.success);
  
  console.log(`\nSummary:`);
  console.log(`  Total stocks processed: ${results.length}`);
  console.log(`  Successful: ${successResults.length}`);
  console.log(`  Failed: ${failedResults.length}`);
  
  if (successResults.length > 0) {
    const avgReturn = successResults.reduce((sum, r) => sum + r.combinationEvaluation.totalReturn, 0) / successResults.length;
    const avgWinRate = successResults.reduce((sum, r) => sum + r.combinationEvaluation.winRate, 0) / successResults.length;
    
    console.log(`\nPerformance stats (successful):`);
    console.log(`  Average total return: ${avgReturn.toFixed(2)}%`);
    console.log(`  Average win rate: ${avgWinRate.toFixed(2)}%`);
    
    const sortedByReturn = [...successResults].sort((a, b) => 
      b.combinationEvaluation.totalReturn - a.combinationEvaluation.totalReturn
    );
    
    console.log(`\nTop 5 performing stocks:`);
    for (let i = 0; i < Math.min(5, sortedByReturn.length); i++) {
      const stock = sortedByReturn[i];
      console.log(`  ${i + 1}. ${stock.symbol}: ${stock.combinationEvaluation.totalReturn.toFixed(2)}% return, ${stock.combinationEvaluation.winRate.toFixed(2)}% win rate`);
    }
    
    saveResults(sortedByReturn.slice(0, 100), `top_100_stocks_${timestamp}.json`, config.outputDir);
  }
  
  if (failedResults.length > 0) {
    saveResults(failedResults, `failed_stocks_${timestamp}.json`, config.outputDir);
  }
  
  console.log('\nDone!');
}

export {
  main,
  batchFactorMining,
  mineSingleStock,
  generateStockList,
  getStockListFromCache,
  DEFAULT_CONFIG,
  setConfig,
  getConfig
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
