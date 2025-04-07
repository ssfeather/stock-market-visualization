const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');
require('dotenv').config();

const app = express();

app.use(express.json());

// 允许跨域请求
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST');
  next();
});

// Tavily API 路由
app.post('/api/tavily', async (req, res) => {
  try {
    const { query, search_depth, include_domains, exclude_domains, max_results } = req.body;
    
    if (!process.env.TAVILY_API_KEY) {
      throw new Error('Tavily API key is not configured');
    }
    
    const response = await axios.post('https://api.tavily.com/search', {
      api_key: process.env.TAVILY_API_KEY,
      query,
      search_depth,
      include_domains,
      exclude_domains,
      max_results
    });

    res.json(response.data);
  } catch (error) {
    console.error('Tavily API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch news',
      details: error.response?.data || error.message 
    });
  }
});

// 保存预测报告
app.post('/api/savePrediction', async (req, res) => {
  try {
    const { fileName, content } = req.body;
    
    // 确保 reports 目录存在
    await fs.mkdir('reports', { recursive: true });
    
    // 保存报告文件
    await fs.writeFile(fileName, content, 'utf8');
    
    res.json({ success: true, message: '预测报告已保存' });
  } catch (error) {
    console.error('保存预测报告失败:', error);
    res.status(500).json({ success: false, error: '保存预测报告失败' });
  }
});

// 在开发环境中，将其他请求代理到 React 开发服务器
if (process.env.NODE_ENV === 'development') {
  const proxy = createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true
  });

  app.use((req, res, next) => {
    if (!req.url.startsWith('/api')) {
      proxy(req, res, next);
    } else {
      next();
    }
  });
}

// 查找可用端口
const findAvailablePort = async (startPort) => {
  const net = require('net');
  
  const portAvailable = (port) => {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      server.listen(port);
    });
  };

  let port = startPort;
  while (!(await portAvailable(port))) {
    port++;
  }
  return port;
};

// 启动服务器
const startServer = async () => {
  try {
    const port = await findAvailablePort(3001);
    app.listen(port, () => {
      console.log(`服务器运行在端口 ${port}`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

startServer(); 