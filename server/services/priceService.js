const WebSocket = require('ws');

class PriceService {
  constructor() {
    this.prices = new Map();
    this.ws = null;
    this.init();
  }

  init() {
    this.connect();
  }

  connect() {
    this.ws = new WebSocket('wss://stream.binance.com:9443/ws/!miniTicker@arr');
    
    this.ws.on('open', () => {
      console.log('Binance WebSocket Connected');
    });

    this.ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          parsed.forEach(ticker => {
            if (ticker.s && ticker.c && ticker.s.endsWith('USDT')) {
              const pair = ticker.s.replace('USDT', '/USDT');
              this.prices.set(pair, {
                price: parseFloat(ticker.c),
                high: parseFloat(ticker.h),
                low: parseFloat(ticker.l),
                volume: parseFloat(ticker.v),
                timestamp: Date.now()
              });
            }
          });
        }
      } catch (err) {
        // ignore parse error
      }
    });

    this.ws.on('error', (err) => {
      console.error('Binance WS Error', err);
    });

    this.ws.on('close', () => {
      console.log('Binance WS Closed, reconnecting in 5s...');
      setTimeout(() => this.connect(), 5000);
    });
  }

  getPrice(pair) {
    return this.prices.get(pair) || null;
  }

  getMultiplePrices(pairs) {
    const result = {};
    pairs.forEach(pair => {
      const priceData = this.getPrice(pair);
      if (priceData) {
        result[pair] = priceData;
      }
    });
    return result;
  }
  
  getAllPrices() {
    return Object.fromEntries(this.prices);
  }
}

module.exports = new PriceService();
