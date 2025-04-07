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

### News Analysis
![News Analysis](demo/news_1.png)

### AI Analysis
![AI Analysis 1](demo/ai_ana_1.png)
![AI Analysis 2](demo/ai_ana_2.png)

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

4. Start the backend server:
```bash
node server.js
```

5. Start the development server:
```bash
npm start
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3001                                    # Frontend development server port

# API Keys
REACT_APP_ALPHA_VANTAGE_API_KEY=your_key    # Stock data API key from Alpha Vantage
REACT_APP_OPENROUTER_API_KEY=your_key       # AI analysis API key from OpenRouter
TAVILY_API_KEY=your_key                     # News search API key from Tavily
```

You can obtain the API keys from:
- Alpha Vantage: https://www.alphavantage.co/support/#api-key
- OpenRouter: https://openrouter.ai/keys
- Tavily: https://tavily.com/

Note: Replace `your_key` with your actual API keys. Never commit your API keys to version control.

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
