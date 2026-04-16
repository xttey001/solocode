import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ISeriesApi, CandlestickData, HistogramData, Time } from 'lightweight-charts';
import { useKlineReplayStore } from '../store';

const KlineChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const [chartInstance, setChartInstance] = useState<any>(null);
  const [tooltipData, setTooltipData] = useState<any>(null);
  
  const { klineData, playback, setCurrentIndex, togglePlayback, updateSettings, settings } = useKlineReplayStore();
  
  // 播放控制函数
  const handlePlayPause = useCallback(() => {
    togglePlayback();
  }, [togglePlayback]);
  
  // 速度调节函数
  const handleSpeedChange = useCallback((speed: number) => {
    updateSettings({ playbackSpeed: speed });
  }, [updateSettings]);
  
  // 重置函数
  const handleReset = useCallback(() => {
    setCurrentIndex(0);
  }, [setCurrentIndex]);
  
  // 进度条拖动函数
  const handleProgressChange = useCallback((value: number) => {
    if (!klineData) return;
    const newIndex = Math.floor(value * (klineData.candles.length - 1));
    setCurrentIndex(newIndex);
  }, [klineData, setCurrentIndex]);
  
  // 动画循环
  useEffect(() => {
    if (!playback.isPlaying || !klineData) return;
    
    const animationLoop = (timestamp: number) => {
      if (!lastUpdateTimeRef.current) {
        lastUpdateTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - lastUpdateTimeRef.current;
      const speed = settings.playbackSpeed || 1;
      const frameInterval = 1000 / (30 * speed); // 30 FPS base
      
      if (elapsed >= frameInterval) {
        lastUpdateTimeRef.current = timestamp;
        
        if (playback.currentIndex < klineData.candles.length - 1) {
          setCurrentIndex(playback.currentIndex + 1);
        } else {
          // 回放结束
          togglePlayback();
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(animationLoop);
    };
    
    animationFrameRef.current = requestAnimationFrame(animationLoop);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playback.isPlaying, playback.currentIndex, klineData, setCurrentIndex, togglePlayback, settings.playbackSpeed]);
  
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    // 创建图表实例
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 600,
      layout: {
        backgroundColor: '#1a202c',
        textColor: '#e2e8f0',
      },
      grid: {
        vertLines: {
          color: '#2d3748',
          style: 1,
          width: 1,
        },
        horzLines: {
          color: '#2d3748',
          style: 1,
          width: 1,
        },
      },
      priceScale: {
        borderColor: '#4a5568',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
        autoScale: true,
      },
      timeScale: {
        borderColor: '#4a5568',
        fixLeftEdge: true,
        lockVisibleTimeRangeOnResize: true,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 2, // Magnet mode
        snap: true,
        labelVisible: true,
        labelBackgroundColor: '#2d3748',
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      rightPriceScale: {
        visible: true,
        borderColor: '#4a5568',
      },
      leftPriceScale: {
        visible: false,
      },
    });
    
    // 创建蜡烛图系列
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#48bb78',
      downColor: '#f56565',
      borderUpColor: '#48bb78',
      borderDownColor: '#f56565',
      wickUpColor: '#48bb78',
      wickDownColor: '#f56565',
      hollowCandle: false,
      borderVisible: true,
      wickVisible: true,
      priceLineVisible: false,
    });
    
    // 创建成交量系列
    const volumeSeries = chart.addHistogramSeries({
      color: '#8884d8',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8, // 成交量图占20%高度
        bottom: 0,
      },
    });
    
    // 鼠标点击事件 - 选择起始点
    chart.subscribeClick((param: any) => {
      if (param.point && param.time && klineData) {
        // 找到点击时间对应的索引
        const targetTime = param.time;
        let closestIndex = 0;
        let minTimeDiff = Infinity;
        
        klineData.candles.forEach((candle, index) => {
          const candleTime = new Date(candle.timestamp).getTime() / 1000;
          const timeDiff = Math.abs(candleTime - targetTime);
          if (timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            closestIndex = index;
          }
        });
        
        setCurrentIndex(closestIndex);
      }
    });
    
    // 鼠标移动事件 - 显示tooltip
    chart.subscribeCrosshairMove((param: any) => {
      if (param.time && klineData) {
        const targetTime = param.time;
        let closestIndex = 0;
        let minTimeDiff = Infinity;
        
        klineData.candles.forEach((candle, index) => {
          const candleTime = new Date(candle.timestamp).getTime() / 1000;
          const timeDiff = Math.abs(candleTime - targetTime);
          if (timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            closestIndex = index;
          }
        });
        
        const candle = klineData.candles[closestIndex];
        setTooltipData({
          timestamp: candle.timestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        });
      } else {
        setTooltipData(null);
      }
    });
    
    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    setChartInstance(chart);
    
    // 清理函数
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      chart.remove();
    };
  }, []);
  
  useEffect(() => {
    if (!klineData || !candleSeriesRef.current || !volumeSeriesRef.current) return;
    
    // 转换数据格式
    const candleData: CandlestickData[] = klineData.candles.map(candle => ({
      time: new Date(candle.timestamp).getTime() / 1000,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));
    
    const volumeData: HistogramData[] = klineData.candles.map(candle => ({
      time: new Date(candle.timestamp).getTime() / 1000,
      value: candle.volume,
      color: candle.close >= candle.open ? '#48bb78' : '#f56565',
    }));
    
    // 更新图表数据
    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);
    
    // 调整视图范围
    if (chartRef.current) {
      const startIndex = Math.max(0, playback.currentIndex - 50);
      const endIndex = Math.min(playback.currentIndex + 50, klineData.candles.length - 1);
      chartRef.current.timeScale().setVisibleRange({
        from: new Date(klineData.candles[startIndex].timestamp).getTime() / 1000,
        to: new Date(klineData.candles[endIndex].timestamp).getTime() / 1000,
      });
    }
  }, [klineData]);
  
  useEffect(() => {
    if (!playback || !klineData || !chartRef.current) return;
    
    // 调整视图范围以跟随当前回放位置
    const currentIndex = playback.currentIndex;
    const startIndex = Math.max(0, currentIndex - 50);
    const endIndex = Math.min(currentIndex + 50, klineData.candles.length - 1);
    
    // 平滑的视图范围调整
    chartRef.current.timeScale().setVisibleRange({
      from: new Date(klineData.candles[startIndex].timestamp).getTime() / 1000,
      to: new Date(klineData.candles[endIndex].timestamp).getTime() / 1000,
    });
  }, [playback.currentIndex, klineData]);
  
  return (
    <div className="w-full">
      <div 
        ref={chartContainerRef} 
        className="w-full h-[600px] bg-gray-900 rounded-lg relative"
      >
        {/* 自定义Tooltip */}
        {tooltipData && (
          <div className="absolute bg-gray-800 border border-gray-700 rounded-md p-3 text-sm text-white shadow-lg z-10">
            <div className="font-medium">{new Date(tooltipData.timestamp).toLocaleString()}</div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div>开: {tooltipData.open.toFixed(2)}</div>
              <div>收: {tooltipData.close.toFixed(2)}</div>
              <div>高: {tooltipData.high.toFixed(2)}</div>
              <div>低: {tooltipData.low.toFixed(2)}</div>
              <div colSpan={2}>量: {tooltipData.volume.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>
      
      {/* 回放控制面板 */}
      <div className="mt-4 flex flex-col space-y-4">
        {/* 进度条 */}
        <div className="w-full">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>{klineData ? new Date(klineData.candles[0].timestamp).toLocaleString() : '开始'}</span>
            <span>{klineData ? new Date(klineData.candles[klineData.candles.length - 1].timestamp).toLocaleString() : '结束'}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={klineData ? playback.currentIndex / (klineData.candles.length - 1) : 0}
            onChange={(e) => handleProgressChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
        
        <div className="flex items-center justify-between bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleReset}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>重置</span>
            </button>
            <button 
              onClick={handlePlayPause}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center space-x-2"
            >
              {playback.isPlaying ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>暂停</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>播放</span>
                </>
              )}
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-white">速度:</span>
            <div className="flex space-x-2">
              {[0.5, 1, 2, 3, 5].map(speed => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    settings.playbackSpeed === speed 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
          
          <div className="text-white font-mono text-sm">
            {klineData && (
              <span>
                {Math.round((playback.currentIndex / (klineData.candles.length - 1)) * 100)}% - 
                {new Date(klineData.candles[Math.min(playback.currentIndex, klineData.candles.length - 1)].timestamp).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KlineChart;
