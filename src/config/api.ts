export const API_CONFIG = {
  "ALPHA_VANTAGE": {
    "BASE_URL": "https://www.alphavantage.co/query",
    "KEYS": [
      {
        "key": "SCTH8I9W4JR6LMXB",
        "description": "Default Key"
      }
    ],
    "FUNCTIONS": {
      "INTRADAY": "TIME_SERIES_INTRADAY",
      "DAILY": "TIME_SERIES_DAILY",
      "WEEKLY": "TIME_SERIES_WEEKLY",
      "MONTHLY": "TIME_SERIES_MONTHLY"
    },
    "INTERVALS": {
      "FIVE_MIN": "5min",
      "FIFTEEN_MIN": "15min",
      "THIRTY_MIN": "30min",
      "SIXTY_MIN": "60min"
    }
  },
  "STOCKS": {
    "COMMON_STOCKS": [
      {
        "symbol": "IBM",
        "name": "IBM"
      },
      {
        "symbol": "AAPL",
        "name": "Apple Inc."
      },
      {
        "symbol": "MSFT",
        "name": "Microsoft"
      },
      {
        "symbol": "GOOGL",
        "name": "Alphabet (Google)"
      },
      {
        "symbol": "AMZN",
        "name": "Amazon"
      },
      {
        "symbol": "META",
        "name": "Meta (Facebook)"
      },
      {
        "symbol": "TSLA",
        "name": "Tesla"
      },
      {
        "symbol": "NVDA",
        "name": "NVIDIA"
      },
      {
        "symbol": "JPM",
        "name": "JPMorgan Chase"
      },
      {
        "symbol": "WMT",
        "name": "Walmart"
      },
      {
        "symbol": "COST",
        "name": "COSTCO"
      }
    ],
    "TIME_INTERVALS": {
      "INTRADAY": {
        "label": "5-Minute",
        "value": "5min"
      },
      "DAILY": {
        "label": "Daily",
        "value": "daily"
      },
      "WEEKLY": {
        "label": "Weekly",
        "value": "weekly"
      },
      "MONTHLY": {
        "label": "Monthly",
        "value": "monthly"
      }
    }
  }
};