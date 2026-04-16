import fs from 'fs';
import path from 'path';
import parquet from 'parquetjs';
import fetch from 'node-fetch';

// 缓存目录
const CACHE_DIR = path.join(__dirname, '../../cache_data');

// 内存缓存
const memoryCache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL = 3600000; // 1小时缓存过期时间

// 确保缓存目录存在
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// 批量从缓存获取数据（优化版）
export async function batchGetDataFromCache(symbols: string[], interval: string) {
  const results: any[] = [];
  const missingSymbols: string[] = [];
  
  // 首先检查内存缓存
  for (const symbol of symbols) {
    const cacheKey = `${symbol}_${interval}`;
    const cachedData = memoryCache.get(cacheKey);
    const now = Date.now();
    
    if (cachedData && (now - cachedData.timestamp) < CACHE_TTL) {
      results.push(cachedData.data);
    } else {
      missingSymbols.push(symbol);
    }
  }
  
  // 从磁盘缓存读取缺失的数据
  if (missingSymbols.length > 0) {
    const diskResults = await Promise.all(
      missingSymbols.map(async (symbol) => {
        try {
          return await getDataFromCache(symbol, interval);
        } catch (error) {
          return null;
        }
      })
    );
    
    results.push(...diskResults.filter(Boolean));
  }
  
  return results;
}

// 从缓存获取数据（优先使用内存缓存）
export async function getDataFromCache(symbol: string, interval: string) {
  const cacheKey = `${symbol}_${interval}`;
  
  // 检查内存缓存
  const cachedData = memoryCache.get(cacheKey);
  const now = Date.now();
  
  if (cachedData && (now - cachedData.timestamp) < CACHE_TTL) {
    return cachedData.data;
  }
  
  // 从磁盘缓存读取
  const cacheFile = path.join(CACHE_DIR, `${cacheKey}.parquet`);
  
  if (!fs.existsSync(cacheFile)) {
    throw new Error('Cache file not found');
  }
  
  try {
    const reader = await parquet.ParquetReader.openFile(cacheFile);
    const cursor = reader.getCursor();
    const records: any[] = [];
    
    // 批量读取，提高性能
    const batchSize = 5000; // 增加批处理大小
    let batch: any[] = [];
    let record;
    
    while (record = await cursor.next()) {
      batch.push(record);
      if (batch.length >= batchSize) {
        records.push(...batch);
        batch = [];
      }
    }
    
    if (batch.length > 0) {
      records.push(...batch);
    }
    
    await reader.close();
    
    const data = {
      symbol,
      interval,
      candles: records
    };
    
    // 更新内存缓存
    memoryCache.set(cacheKey, {
      data,
      timestamp: now
    });
    
    return data;
  } catch (error) {
    throw new Error('Failed to read cache file');
  }
}

// 从API获取数据（带故障切换）
export async function fetchDataFromAPI(symbol: string, interval: string) {
  const sources = ['akshare', 'tencent', 'sina'];
  
  for (const source of sources) {
    try {
      let data;
      switch (source) {
        case 'akshare':
          data = await fetchFromAKShare(symbol, interval);
          break;
        case 'tencent':
          data = await fetchFromTencent(symbol, interval);
          break;
        case 'sina':
          data = await fetchFromSina(symbol, interval);
          break;
        default:
          data = generateMockData(symbol, interval);
      }
      
      // 保存到缓存
      await saveToCache(symbol, interval, data.candles);
      
      return data;
    } catch (error) {
      console.error(`Failed to fetch data from ${source}:`, error);
      // 继续尝试下一个数据源
      continue;
    }
  }
  
  // 所有数据源都失败，返回模拟数据
  const mockData = generateMockData(symbol, interval);
  await saveToCache(symbol, interval, mockData.candles);
  return mockData;
}

// 从AKShare获取数据
async function fetchFromAKShare(symbol: string, interval: string) {
  try {
    // AKShare API 接口（示例）
    const response = await fetch(`https://api.akshare.xyz/api/stock/chart?symbol=${symbol}&period=${interval}&adjust=qfq`, {
      timeout: 5000, // 减少超时时间
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`AKShare API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code !== 200) {
      throw new Error(`AKShare API error: ${data.msg}`);
    }
    
    // 转换数据格式
    const candles = data.data.map((item: any) => ({
      timestamp: new Date(item[0]).toISOString(),
      open: parseFloat(item[1]),
      high: parseFloat(item[2]),
      low: parseFloat(item[3]),
      close: parseFloat(item[4]),
      volume: parseFloat(item[5])
    }));
    
    return {
      symbol,
      interval,
      candles
    };
  } catch (error) {
    throw new Error('Failed to fetch data from AKShare');
  }
}

// 从腾讯获取数据
async function fetchFromTencent(symbol: string, interval: string) {
  try {
    // 腾讯API 接口（示例）
    const response = await fetch(`https://web.ifzq.gtimg.cn/appstock/app/kline/kline?param=${symbol},${interval},1000`, {
      timeout: 5000 // 减少超时时间
    });
    
    if (!response.ok) {
      throw new Error(`Tencent API error: ${response.status}`);
    }
    
    const data = await response.json();
    const klineData = data[symbol][interval];
    
    // 转换数据格式
    const candles = klineData.map((item: any) => ({
      timestamp: new Date(parseInt(item[0]) * 1000).toISOString(),
      open: parseFloat(item[1]),
      high: parseFloat(item[2]),
      low: parseFloat(item[3]),
      close: parseFloat(item[4]),
      volume: parseFloat(item[5])
    }));
    
    return {
      symbol,
      interval,
      candles
    };
  } catch (error) {
    throw new Error('Failed to fetch data from Tencent');
  }
}

// 从新浪获取数据
async function fetchFromSina(symbol: string, interval: string) {
  try {
    // 新浪API 接口（示例）
    const response = await fetch(`https://quotes.sina.cn/cn/api/jsonp.php/var%20_{symbol}=/CN_MarketDataService.getKLineData?symbol=${symbol}&scale=${getSinaInterval(interval)}&datalen=1000`, {
      timeout: 5000 // 减少超时时间
    });
    
    if (!response.ok) {
      throw new Error(`Sina API error: ${response.status}`);
    }
    
    const text = await response.text();
    // 解析JSONP响应
    const jsonStr = text.replace(/^.*?=/, '').replace(/;$/, '');
    const data = JSON.parse(jsonStr);
    
    // 转换数据格式
    const candles = data.map((item: any) => ({
      timestamp: new Date(item.day).toISOString(),
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: parseFloat(item.volume)
    }));
    
    return {
      symbol,
      interval,
      candles
    };
  } catch (error) {
    throw new Error('Failed to fetch data from Sina');
  }
}

// 转换为新浪API的时间间隔格式
function getSinaInterval(interval: string): string {
  const intervalMap: Record<string, string> = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '30m': '30',
    '60m': '60',
    '1h': '60',
    '1d': '240',
    '1w': '10080',
    '1M': '43200'
  };
  
  return intervalMap[interval] || '60'; // 默认1小时
}

// 保存数据到缓存
async function saveToCache(symbol: string, interval: string, candles: any[]) {
  const cacheKey = `${symbol}_${interval}`;
  const cacheFile = path.join(CACHE_DIR, `${cacheKey}.parquet`);
  
  try {
    const schema = new parquet.ParquetSchema({
      timestamp: { type: 'UTF8' },
      open: { type: 'DOUBLE' },
      high: { type: 'DOUBLE' },
      low: { type: 'DOUBLE' },
      close: { type: 'DOUBLE' },
      volume: { type: 'DOUBLE' }
    });
    
    const writer = await parquet.ParquetWriter.openFile(schema, cacheFile);
    
    // 批量写入，提高性能
    const batchSize = 5000; // 增加批处理大小
    let batch: any[] = [];
    
    for (const candle of candles) {
      batch.push(candle);
      if (batch.length >= batchSize) {
        for (const item of batch) {
          await writer.appendRow(item);
        }
        batch = [];
      }
    }
    
    if (batch.length > 0) {
      for (const item of batch) {
        await writer.appendRow(item);
      }
    }
    
    await writer.close();
    
    // 更新内存缓存
    memoryCache.set(cacheKey, {
      data: {
        symbol,
        interval,
        candles
      },
      timestamp: Date.now()
    });
    
    // 清理过期缓存
    cleanupMemoryCache();
  } catch (error) {
    console.error('Failed to save data to cache:', error);
  }
}

// 清理过期的内存缓存
function cleanupMemoryCache() {
  const now = Date.now();
  for (const [key, value] of memoryCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      memoryCache.delete(key);
    }
  }
}

// 生成模拟数据
function generateMockData(symbol: string, interval: string) {
  const candles = [];
  const now = new Date();
  let price = 40000;
  
  // 批量生成数据
  const batchSize = 1000; // 增加批处理大小
  for (let i = 240; i >= 0; i -= batchSize) {
    for (let j = Math.min(batchSize, i); j > 0; j--) {
      const timestamp = new Date(now.getTime() - (i - j + 1) * 60 * 60 * 1000).toISOString();
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
  }
  
  return {
    symbol,
    interval,
    candles
  };
}

// 批量获取数据（优化版）
export async function batchGetData(symbols: string[], interval: string) {
  const batchSize = 100; // 每批处理的股票数量
  const results: any[] = [];
  
  // 分批处理
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    
    // 并行处理当前批次
    const batchResults = await Promise.all(
      batch.map(symbol => {
        return getDataFromCache(symbol, interval).catch(() => {
          return fetchDataFromAPI(symbol, interval);
        });
      })
    );
    
    results.push(...batchResults);
  }
  
  return results;
}

// 清理缓存
export function clearCache() {
  memoryCache.clear();
  console.log('Memory cache cleared');
}

// 获取缓存状态
export function getCacheStatus() {
  return {
    memoryCacheSize: memoryCache.size,
    diskCacheSize: fs.readdirSync(CACHE_DIR).length
  };
}

// 预热缓存
export async function prewarmCache(symbols: string[], interval: string) {
  console.log(`Prewarming cache for ${symbols.length} symbols...`);
  const startTime = Date.now();
  
  await batchGetData(symbols, interval);
  
  const elapsed = Date.now() - startTime;
  console.log(`Cache prewarmed in ${(elapsed / 1000).toFixed(2)}s`);
}

// 批量删除缓存
export function batchDeleteCache(symbols: string[], interval: string) {
  for (const symbol of symbols) {
    const cacheKey = `${symbol}_${interval}`;
    memoryCache.delete(cacheKey);
    const cacheFile = path.join(CACHE_DIR, `${cacheKey}.parquet`);
    if (fs.existsSync(cacheFile)) {
      fs.unlinkSync(cacheFile);
    }
  }
  console.log(`Deleted cache for ${symbols.length} symbols`);
}