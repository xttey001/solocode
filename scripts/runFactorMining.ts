#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { main as originalMain, DEFAULT_CONFIG } from './localFactorMining';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ExtendedConfig {
  interval: string;
  populationSize: number;
  generations: number;
  mutationRate: number;
  batchSize: number;
  outputDir: string;
  cacheDir: string;
  symbols?: string[] | null;
}

function loadConfig(configPath?: string): ExtendedConfig {
  let config: ExtendedConfig = { ...DEFAULT_CONFIG };

  if (configPath) {
    const fullPath = path.resolve(configPath);
    if (fs.existsSync(fullPath)) {
      try {
        const fileContent = fs.readFileSync(fullPath, 'utf-8');
        const loadedConfig = JSON.parse(fileContent);
        
        config = {
          ...config,
          ...loadedConfig
        };
        
        console.log(`Configuration loaded from ${fullPath}`);
      } catch (error) {
        console.warn(`Failed to load config from ${fullPath}, using defaults`);
      }
    } else {
      console.warn(`Config file ${fullPath} not found, using defaults`);
    }
  }

  if (config.outputDir && !path.isAbsolute(config.outputDir)) {
    config.outputDir = path.resolve(__dirname, config.outputDir);
  }
  
  if (config.cacheDir && !path.isAbsolute(config.cacheDir)) {
    config.cacheDir = path.resolve(__dirname, config.cacheDir);
  }

  return config;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options: any = {
    config: null,
    interval: null,
    populationSize: null,
    generations: null,
    mutationRate: null,
    batchSize: null,
    outputDir: null,
    cacheDir: null,
    symbols: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--config=')) {
      options.config = arg.slice(9);
    } else if (arg === '--config' && i + 1 < args.length) {
      options.config = args[++i];
    } else if (arg.startsWith('--interval=')) {
      options.interval = arg.slice(11);
    } else if (arg.startsWith('--population-size=')) {
      options.populationSize = parseInt(arg.slice(17));
    } else if (arg.startsWith('--generations=')) {
      options.generations = parseInt(arg.slice(14));
    } else if (arg.startsWith('--mutation-rate=')) {
      options.mutationRate = parseFloat(arg.slice(15));
    } else if (arg.startsWith('--batch-size=')) {
      options.batchSize = parseInt(arg.slice(13));
    } else if (arg.startsWith('--output-dir=')) {
      options.outputDir = arg.slice(13);
    } else if (arg.startsWith('--cache-dir=')) {
      options.cacheDir = arg.slice(12);
    } else if (arg.startsWith('--symbols=')) {
      options.symbols = arg.slice(10).split(',');
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Local Factor Mining Script

Usage:
  node runFactorMining.ts [options]

Options:
  --config, --config=<path>       Path to configuration file
  --interval=<interval>           Data interval (1m, 5m, 15m, 30m, 1h, 1d, 1w, 1M)
  --population-size=<number>      Genetic algorithm population size (50-200)
  --generations=<number>          Number of generations (100-500)
  --mutation-rate=<number>        Mutation rate (0.05-0.3)
  --batch-size=<number>           Batch size for processing (20-100)
  --output-dir=<path>             Output directory for results
  --cache-dir=<path>              Cache directory for stock data
  --symbols=<sym1,sym2,...>       Comma-separated list of symbols to process
  --help, -h                      Show this help message

Examples:
  node runFactorMining.ts
  node runFactorMining.ts --config=./config.json
  node runFactorMining.ts --interval=1d --generations=300
  node runFactorMining.ts --symbols=000001,000002,000003
`);
}

function mergeConfigWithArgs(baseConfig: ExtendedConfig, args: any): ExtendedConfig {
  const config = { ...baseConfig };
  
  if (args.interval) config.interval = args.interval;
  if (args.populationSize) config.populationSize = args.populationSize;
  if (args.generations) config.generations = args.generations;
  if (args.mutationRate) config.mutationRate = args.mutationRate;
  if (args.batchSize) config.batchSize = args.batchSize;
  if (args.outputDir) config.outputDir = args.outputDir;
  if (args.cacheDir) config.cacheDir = args.cacheDir;
  if (args.symbols) config.symbols = args.symbols;
  
  return config;
}

async function main() {
  console.log('========================================');
  console.log('  Local Factor Mining & Genetic Algorithm');
  console.log('========================================\n');

  const args = parseArgs();
  let config = loadConfig(args.config);
  config = mergeConfigWithArgs(config, args);

  console.log('Final configuration:');
  console.log(JSON.stringify({
    interval: config.interval,
    populationSize: config.populationSize,
    generations: config.generations,
    mutationRate: config.mutationRate,
    batchSize: config.batchSize,
    outputDir: config.outputDir,
    cacheDir: config.cacheDir,
    symbols: config.symbols ? `${config.symbols.length} symbols specified` : 'auto-detect from cache'
  }, null, 2));
  console.log();

  process.env.MINING_CONFIG = JSON.stringify(config);

  await originalMain();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main, loadConfig, parseArgs, mergeConfigWithArgs };
