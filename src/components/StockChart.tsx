import React, { useState, useEffect, useCallback } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Area
} from 'recharts';
import { 
  Button, 
  Box, 
  Paper,
  Typography,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
  Link,
  Tabs,
  Tab,
  IconButton,
  Collapse,
  Alert,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import axios from 'axios';
import { API_CONFIG } from '../config/api';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import { format } from 'date-fns';
import fs from 'fs';

interface StockChartProps {
  config: typeof API_CONFIG;
}

interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PredictionResult {
  prediction: string;
  confidence: string;
  reasoning: string;
}

type ChartType = 'line' | 'area' | 'composed';
type TimeInterval = '5min' | 'daily' | 'weekly' | 'monthly';

interface NewsItem {
  title: string;
  url: string;
  description: string;
  publishedDate?: string;
  aiAnalysis?: string;
  isAnalyzing?: boolean;
}

// 添加聚合数据的辅助函数
const aggregateData = (data: StockData[], interval: TimeInterval): StockData[] => {
  if (interval === '5min') return data;

  // 按照日期分组
  const groupedData = data.reduce((acc: { [key: string]: StockData[] }, curr) => {
    let key = '';
    const date = dayjs(curr.date);
    
    switch (interval) {
      case 'daily':
        key = date.format('YYYY-MM-DD');
        break;
      case 'weekly':
        key = date.startOf('week').format('YYYY-MM-DD');
        break;
      case 'monthly':
        key = date.format('YYYY-MM');
        break;
    }

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(curr);
    return acc;
  }, {});

  // 计算每个分组的聚合数据
  return Object.entries(groupedData).map(([date, values]) => {
    const firstData = values[0];
    const lastData = values[values.length - 1];
    
    return {
      date: interval === 'monthly' ? `${date}-01` : date, // 对于月线，使用月份的第一天
      open: firstData.open,
      high: Math.max(...values.map(v => v.high)),
      low: Math.min(...values.map(v => v.low)),
      close: lastData.close,
      volume: values.reduce((sum, v) => sum + v.volume, 0)
    };
  }).sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`stock-tabpanel-${index}`}
      aria-labelledby={`stock-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const StockChart: React.FC<StockChartProps> = ({ config }) => {
  const [symbol, setSymbol] = useState<string>('');
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().subtract(1, 'month'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [currentKeyIndex, setCurrentKeyIndex] = useState(0);
  const [apiKey, setApiKey] = useState(process.env.REACT_APP_ALPHA_VANTAGE_API_KEY || '');
  const [timeInterval, setTimeInterval] = useState<TimeInterval>('5min');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState<boolean>(false);
  const [newsError, setNewsError] = useState<string>('');
  const [tabValue, setTabValue] = useState(0);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predictLoading, setPredictLoading] = useState<boolean>(false);

  const handleChartTypeChange = (event: React.MouseEvent<HTMLElement>, newType: ChartType | null) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  const fetchStockData = useCallback(async () => {
    if (!symbol || !startDate || !endDate) {
      setError('Please select a stock symbol and date range');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 始终获取5分钟数据
      const params = new URLSearchParams({
        function: config.ALPHA_VANTAGE.FUNCTIONS.INTRADAY,
        symbol: symbol,
        interval: config.ALPHA_VANTAGE.INTERVALS.FIVE_MIN,
        outputsize: 'full',
        apikey: apiKey
      });

      const url = `${config.ALPHA_VANTAGE.BASE_URL}?${params.toString()}`;
      console.log('Fetching data from:', url);
      
      const response = await axios.get(url);
      console.log('API Response:', response.data);

      if (response.data['Error Message']) {
        throw new Error(response.data['Error Message']);
      }

      if (response.data['Information']?.includes('API rate limit')) {
        throw new Error('API rate limit reached. Please try again later or use a different API key.');
      }

      if (response.data['Note']) {
        throw new Error('API call frequency limit reached. Please wait a minute before trying again.');
      }

      const timeSeries = response.data['Time Series (5min)'];
      if (!timeSeries) {
        console.error('Available keys in response:', Object.keys(response.data));
        throw new Error(`No data found for ${symbol}. Available data keys: ${Object.keys(response.data).join(', ')}`);
      }

      // 解析5分钟数据
      let rawData = Object.entries(timeSeries)
        .map(([date, values]: [string, any]) => ({
          date,
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseFloat(values['5. volume'])
        }))
        .filter(item => {
          const itemDate = dayjs(item.date);
          return itemDate.isAfter(startDate) && itemDate.isBefore(endDate);
        })
        .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());

      if (rawData.length === 0) {
        throw new Error(`No data available for ${symbol} in the selected date range (${startDate?.format('YYYY-MM-DD')} to ${endDate?.format('YYYY-MM-DD')})`);
      }

      // 根据选择的时间周期聚合数据
      const aggregatedData = aggregateData(rawData, timeInterval);
      setStockData(aggregatedData);

    } catch (err: any) {
      console.error('API Error:', err);
      if (err.response) {
        console.error('Error response:', err.response.data);
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
  }, [symbol, startDate, endDate, apiKey, timeInterval, config]);

  // 当时间间隔变化时自动获取数据
  useEffect(() => {
    if (symbol) { // 只有在选择了股票时才自动获取
      fetchStockData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeInterval, fetchStockData]); // 依赖 timeInterval 和 fetchStockData

  const getDateFormat = () => {
    switch (timeInterval) {
      case '5min':
        return 'MM/DD HH:mm';
      case 'daily':
        return 'YYYY-MM-DD';
      case 'weekly':
      case 'monthly':
        return 'YYYY-MM';
      default:
        return 'YYYY-MM-DD';
    }
  };

  const renderChart = () => {
    if (stockData.length === 0) return <></>;

    const commonProps = {
      data: stockData
    };

    const dateFormat = getDateFormat();

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => dayjs(date).format(dateFormat)}
            />
            <YAxis 
              domain={['auto', 'auto']}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <Tooltip 
              labelFormatter={(date) => dayjs(date).format(dateFormat)}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="close"
              stroke="#8884d8"
              name="Close Price"
              dot={false}
            />
          </LineChart>
        );

      case 'area':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => dayjs(date).format(dateFormat)}
            />
            <YAxis 
              yAxisId="left"
              domain={['auto', 'auto']}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => `${value.toFixed(0)}`}
            />
            <Tooltip 
              labelFormatter={(date) => dayjs(date).format(dateFormat)}
              formatter={(value: number, name) => {
                if (name === 'Volume') return [value.toFixed(0), name];
                return [`$${value.toFixed(2)}`, name];
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="close"
              fill="#8884d8"
              stroke="#8884d8"
              name="Close Price"
              yAxisId="left"
            />
            <Bar
              dataKey="volume"
              fill="#82ca9d"
              name="Volume"
              yAxisId="right"
              opacity={0.5}
            />
          </ComposedChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => dayjs(date).format(dateFormat)}
            />
            <YAxis 
              domain={['auto', 'auto']}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <Tooltip 
              labelFormatter={(date) => dayjs(date).format(dateFormat)}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="high"
              stroke="#82ca9d"
              name="High"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="low"
              stroke="#ff7300"
              name="Low"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="close"
              fill="#8884d8"
              stroke="#8884d8"
              name="Close"
              fillOpacity={0.3}
            />
          </ComposedChart>
        );

      default:
        return <></>;
    }
  };

  const fetchStockNews = useCallback(async () => {
    if (!symbol) {
      setNewsError('Please select a stock symbol first');
      return;
    }

    setLoadingNews(true);
    setNewsError('');

    try {
      const response = await fetch('/api/tavily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `${symbol} stock company news latest developments`,
          search_depth: "advanced",
          include_domains: [],
          exclude_domains: [],
          max_results: 5
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const data = await response.json();
      setNews(data.results.map((item: any) => ({
        title: item.title,
        url: item.url,
        description: item.description || item.content,
        publishedDate: item.publishedDate
      })));
    } catch (error) {
      console.error('Error fetching news:', error);
      setNewsError(error instanceof Error ? error.message : 'Failed to fetch news');
    } finally {
      setLoadingNews(false);
    }
  }, [symbol]);

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol);
    // 清空新闻列表
    setNews([]);
    setNewsError('');
    // 清空 AI 分析结果
    setPrediction(null);
    setPredictLoading(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const analyzeNewsItem = async (newsItem: NewsItem, index: number) => {
    try {
      // 更新新闻项的分析状态
      setNews(prevNews => prevNews.map((item, i) => 
        i === index ? { ...item, isAnalyzing: true } : item
      ));

      const response = await fetch('/api/tavily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `Analyze this news article about ${symbol} stock: ${newsItem.title}. ${newsItem.description}
                 Provide a concise analysis of:
                 1. The potential impact on the stock price
                 2. Key points for investors
                 3. Recommendation (if applicable)`,
          search_depth: "advanced",
          max_results: 1
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze news');
      }

      const data = await response.json();
      const analysis = data.results[0].content;

      // 更新新闻项的分析结果
      setNews(prevNews => prevNews.map((item, i) => 
        i === index ? { ...item, aiAnalysis: analysis, isAnalyzing: false } : item
      ));
    } catch (error) {
      console.error('Error analyzing news:', error);
      // 更新新闻项的错误状态
      setNews(prevNews => prevNews.map((item, i) => 
        i === index ? { ...item, isAnalyzing: false } : item
      ));
    }
  };

  const predictStockTrend = async () => {
    if (!stockData.length || !news.length) {
      return;
    }

    setPredictLoading(true);
    try {
      // 准备历史数据
      const historicalData = stockData.slice(-30).map(data => ({
        date: data.date,
        close: data.close,
        volume: data.volume
      }));

      // 准备新闻数据
      const newsData = news.map(item => ({
        title: item.title,
        description: item.description,
        date: item.publishedDate
      }));

      // 构建 prompt
      const prompt = `As a stock market expert, analyze the following data for ${symbol} stock and predict its trend for the next week. Please provide your analysis in Chinese:

Historical Data (last 30 data points):
${JSON.stringify(historicalData, null, 2)}

Recent News:
${JSON.stringify(newsData, null, 2)}

请提供以下分析（用中文回答）:
1. 明确的预测（看涨/看跌）
2. 置信度（高/中/低）
3. 基于技术分析和新闻情绪的详细理由

Format your response as JSON with the following structure:
{
  "prediction": "看涨/看跌",
  "confidence": "高/中/低",
  "reasoning": "详细分析理由（请用中文）"
}`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Stock Trend Prediction'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro-exp-03-25:free',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get prediction');
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      setPrediction(result);

      // 生成并保存预测报告
      await generatePredictionReport(symbol, stockData[stockData.length - 1], news, result);
    } catch (error) {
      console.error('Error predicting stock trend:', error);
    } finally {
      setPredictLoading(false);
    }
  };

  const generatePredictionReport = async (
    stockSymbol: string,
    stockData: any,
    news: any[],
    aiPrediction: PredictionResult
  ) => {
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    const fileName = `reports/prediction_${stockSymbol}_${timestamp}.md`;

    const report = `# ${stockSymbol} 股票预测报告 - ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}

## 股票价格数据

- 最新价格: ${stockData.close}
- 开盘价: ${stockData.open}
- 最高价: ${stockData.high}
- 最低价: ${stockData.low}
- 成交量: ${stockData.volume}

## 相关新闻

${news.map((item: any) => `- ${item.title}\n  ${item.url}\n`).join('\n')}

## AI 分析结果

### 预测结果
- 趋势预测：${aiPrediction.prediction}
- 置信度：${aiPrediction.confidence}

### 分析理由
${aiPrediction.reasoning}

## 技术指标

- 移动平均线（MA）趋势: ${stockData.close > stockData.previousClose ? '上升' : '下降'}
- 成交量趋势: ${stockData.volume > stockData.previousVolume ? '放量' : '缩量'}
- 价格波动: ${((stockData.high - stockData.low) / stockData.low * 100).toFixed(2)}%

## 风险提示

- 本分析仅供参考，不构成投资建议
- 市场瞬息万变，请注意风险
- 建议结合多种分析方法进行决策`;

    try {
      await axios.post('/api/savePrediction', {
        fileName,
        content: report
      });
      console.log('预测报告已保存');
    } catch (error) {
      console.error('保存预测报告失败:', error);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, m: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Stock Price Chart
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Stock Symbol</InputLabel>
            <Select
              value={symbol}
              onChange={(e) => handleSymbolChange(e.target.value)}
              label="Stock Symbol"
            >
              <MenuItem value="">
                <em>Select a stock</em>
              </MenuItem>
              {config.STOCKS.COMMON_STOCKS.map((stock) => (
                <MenuItem key={stock.symbol} value={stock.symbol}>
                  {stock.symbol} - {stock.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Time Interval</InputLabel>
            <Select
              value={timeInterval}
              onChange={(e) => setTimeInterval(e.target.value as TimeInterval)}
              label="Time Interval"
            >
              {Object.values(config.STOCKS.TIME_INTERVALS).map((interval) => (
                <MenuItem key={interval.value} value={interval.value}>
                  {interval.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              sx={{ minWidth: 120 }}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              sx={{ minWidth: 120 }}
            />
          </LocalizationProvider>
        </Box>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="stock data tabs">
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Price Chart</span>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchStockData();
                  }}
                  disabled={loading || !symbol}
                  size="small"
                  sx={{ minWidth: 'auto', p: '4px 8px' }}
                >
                  {loading ? <CircularProgress size={16} /> : 'Fetch'}
                </Button>
              </Box>
            }
            id="stock-tab-0" 
            aria-controls="stock-tabpanel-0" 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Latest News</span>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchStockNews();
                  }}
                  disabled={!symbol || loadingNews}
                  size="small"
                  sx={{ minWidth: 'auto', p: '4px 8px' }}
                >
                  {loadingNews ? <CircularProgress size={16} /> : 'Fetch'}
                </Button>
              </Box>
            } 
            id="stock-tab-1" 
            aria-controls="stock-tabpanel-1"
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>AI Analysis</span>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    predictStockTrend();
                  }}
                  disabled={!symbol || !stockData.length || !news.length || predictLoading}
                  size="small"
                  sx={{ minWidth: 'auto', p: '4px 8px' }}
                >
                  {predictLoading ? <CircularProgress size={16} /> : 'Predict'}
                </Button>
              </Box>
            } 
            id="stock-tab-2" 
            aria-controls="stock-tabpanel-2"
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2 }}>
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={handleChartTypeChange}
            aria-label="chart type"
          >
            <ToggleButton value="line" aria-label="line chart">
              Line Chart
            </ToggleButton>
            <ToggleButton value="area" aria-label="area chart">
              Area + Volume
            </ToggleButton>
            <ToggleButton value="composed" aria-label="composed chart">
              High-Low-Close
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        {stockData.length > 0 && (
          <Box sx={{ height: 500 }}>
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </Box>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {newsError && (
          <Typography color="error" sx={{ mb: 2 }}>
            {newsError}
          </Typography>
        )}
        {news.map((item, index) => (
          <Card key={index} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="h6" component="div">
                  <Link href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </Link>
                </Typography>
                <Box>
                  <Chip
                    icon={item.aiAnalysis ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                    label={item.isAnalyzing ? "分析中..." : (item.aiAnalysis ? "查看分析" : "AI 分析")}
                    color={item.aiAnalysis ? "primary" : "default"}
                    onClick={() => analyzeNewsItem(item, index)}
                    disabled={item.isAnalyzing}
                    sx={{
                      '&:hover': {
                        backgroundColor: item.aiAnalysis ? '#1976d2' : '#e0e0e0',
                        color: item.aiAnalysis ? 'white' : 'inherit'
                      },
                      cursor: 'pointer'
                    }}
                  />
                  {item.isAnalyzing && (
                    <CircularProgress 
                      size={16} 
                      sx={{ 
                        ml: 1,
                        verticalAlign: 'middle'
                      }} 
                    />
                  )}
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {item.publishedDate && `Published: ${item.publishedDate}`}
              </Typography>
              <Typography variant="body1" paragraph>
                {item.description}
              </Typography>
              <Collapse in={!!item.aiAnalysis}>
                <Alert 
                  severity="info" 
                  sx={{ 
                    mt: 1,
                    backgroundColor: '#e3f2fd',
                    '& .MuiAlert-icon': {
                      color: '#1976d2'
                    }
                  }}
                  icon={<AutoGraphIcon />}
                >
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    AI 分析结果
                  </Typography>
                  <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>
                    {item.aiAnalysis}
                  </Typography>
                </Alert>
              </Collapse>
            </CardContent>
          </Card>
        ))}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            AI Analysis Dashboard
          </Typography>
          
          {prediction && (
            <Card sx={{ mb: 4, backgroundColor: '#f5f5f5' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  {symbol} 股票趋势预测
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Chip
                    label={`预测: ${prediction.prediction}`}
                    color={prediction.prediction === '看涨' ? 'success' : 'error'}
                    sx={{ fontWeight: 'bold' }}
                  />
                  <Chip
                    label={`置信度: ${prediction.confidence}`}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                <Alert 
                  severity="info" 
                  sx={{ 
                    backgroundColor: '#e3f2fd',
                    '& .MuiAlert-icon': {
                      color: '#1976d2'
                    }
                  }}
                  icon={<AutoGraphIcon />}
                >
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    分析理由
                  </Typography>
                  <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>
                    {prediction.reasoning}
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          )}

          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            News Analysis
          </Typography>
          {news.filter(item => item.aiAnalysis).map((item, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {item.title}
                </Typography>
                <Alert 
                  severity="info" 
                  sx={{ 
                    mt: 1,
                    backgroundColor: '#e3f2fd',
                    '& .MuiAlert-icon': {
                      color: '#1976d2'
                    }
                  }}
                  icon={<AutoGraphIcon />}
                >
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    AI 分析结果
                  </Typography>
                  <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>
                    {item.aiAnalysis}
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          ))}
        </Box>
      </TabPanel>
    </Paper>
  );
};

export default StockChart; 