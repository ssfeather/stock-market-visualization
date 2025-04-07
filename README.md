# Stock Market Visualization

A React-based web application for visualizing stock market data and performing AI-driven analysis.

## Features

- Real-time stock data visualization
- Historical price trends
- AI-powered market analysis
- News sentiment analysis
- Interactive charts and graphs

## Screenshots

### Stock Price Visualization
![Stock Price Chart](demo/stock_1.png)
![Stock Analysis](demo/stock_2.png)

### AI Analysis
![AI Analysis 1](demo/ai_ana_1.png)
![AI Analysis 2](demo/ai_ana_2.png)

### News Analysis
![News Analysis](demo/news_1.png)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/ssfeather/stock-market-visualization.git
cd stock-market-visualization
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example` and fill in your API keys.

4. Start the development server:
```bash
npm start
```

5. Start the backend server:
```bash
node server.js
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
REACT_APP_API_URL=http://localhost:5000
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
NEWS_API_KEY=your_news_api_key
```

## API Integration

This project integrates with several APIs:

- Alpha Vantage API for stock data
- OpenRouter API for AI analysis
- News API for market news

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
