import express from 'express';
import { getDataFromCache, fetchDataFromAPI } from '../services/dataService';

const router = express.Router();

// 从缓存获取数据
router.get('/cache', async (req, res) => {
  try {
    const { symbol, interval } = req.query;
    if (!symbol || !interval) {
      return res.status(400).json({ error: 'Symbol and interval are required' });
    }
    
    const data = await getDataFromCache(symbol as string, interval as string);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get data from cache' });
  }
});

// 从API获取数据
router.get('/api', async (req, res) => {
  try {
    const { symbol, interval, source } = req.query;
    if (!symbol || !interval) {
      return res.status(400).json({ error: 'Symbol and interval are required' });
    }
    
    const data = await fetchDataFromAPI(
      symbol as string, 
      interval as string, 
      source as string || 'akshare'
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data from API' });
  }
});

export default router;