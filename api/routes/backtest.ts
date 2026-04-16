import express from 'express';
import { runBacktest, runBatchBacktest } from '../services/backtestService';

const router = express.Router();

// 运行单个回测
router.post('/single', async (req, res) => {
  try {
    const { symbol, strategy, params } = req.body;
    if (!symbol || !strategy) {
      return res.status(400).json({ error: 'Symbol and strategy are required' });
    }
    
    const result = await runBacktest(symbol, strategy, params);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to run backtest' });
  }
});

// 运行批量回测
router.post('/batch', async (req, res) => {
  try {
    const { symbols, strategy, params } = req.body;
    if (!symbols || !Array.isArray(symbols) || !strategy) {
      return res.status(400).json({ error: 'Symbols array and strategy are required' });
    }
    
    const results = await runBatchBacktest(symbols, strategy, params);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to run batch backtest' });
  }
});

export default router;