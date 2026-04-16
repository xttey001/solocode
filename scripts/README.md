# 本地因子挖掘与遗传算法脚本

## 概述

本脚本用于从本地缓存数据中挖掘股票因子，并使用遗传算法优化因子组合。

## 文件说明

- [localFactorMining.ts](file:///workspace/scripts/localFactorMining.ts) - 核心因子挖掘脚本
- [runFactorMining.ts](file:///workspace/scripts/runFactorMining.ts) - 命令行入口脚本
- [config.example.json](file:///workspace/scripts/config.example.json) - 配置文件示例

## 功能特性

- 从本地缓存读取5000多只股票数据
- 支持多种技术指标因子（MA、RSI、MACD、布林带、ATR、动量、威廉指标、随机指标、乖离率）
- 使用遗传算法优化因子组合和参数
- 批量处理，支持进度显示
- 结果自动保存到JSON文件

## 使用方法

### 1. 基本使用

```bash
cd /workspace/scripts
npx ts-node runFactorMining.ts
```

### 2. 使用配置文件

```bash
npx ts-node runFactorMining.ts --config=config.example.json
```

### 3. 命令行参数

```bash
# 指定时间间隔和迭代代数
npx ts-node runFactorMining.ts --interval=1d --generations=300

# 指定股票列表
npx ts-node runFactorMining.ts --symbols=000001,000002,000003

# 调整遗传算法参数
npx ts-node runFactorMining.ts --population-size=150 --mutation-rate=0.2
```

### 4. 查看帮助

```bash
npx ts-node runFactorMining.ts --help
```

## 配置说明

| 参数 | 说明 | 默认值 | 推荐范围 |
|------|------|--------|----------|
| interval | 数据时间间隔 | 1h | 1m, 5m, 15m, 30m, 1h, 1d, 1w, 1M |
| populationSize | 种群大小 | 100 | 50-200 |
| generations | 迭代代数 | 200 | 100-500 |
| mutationRate | 突变率 | 0.15 | 0.05-0.3 |
| batchSize | 批量大小 | 50 | 20-100 |
| symbols | 股票列表 | null | 股票代码数组 |

## 输出结果

脚本运行后会在 `mining_results` 目录生成以下文件：

- `mining_results_[timestamp].json` - 完整结果
- `top_100_stocks_[timestamp].json` - 表现最好的100只股票
- `failed_stocks_[timestamp].json` - 处理失败的股票

## 数据准备

确保您的股票数据已缓存在 `cache_data` 目录中，格式为 Parquet 文件。

## 注意事项

- 处理5000只股票可能需要较长时间
- 建议先从小批量测试开始
- 确保有足够的磁盘空间存储结果
