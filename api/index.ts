import express from 'express';
import cors from 'cors';
import dataRoutes from './routes/data';
import backtestRoutes from './routes/backtest';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/data', dataRoutes);
app.use('/api/backtest', backtestRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend service is running' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

export default app;