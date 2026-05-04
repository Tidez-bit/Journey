const WebSocket = require('ws');
const priceService = require('../services/priceService');

function setupPriceSocket(server) {
  const wss = new WebSocket.Server({ server, path: '/ws/prices' });
  
  // Map to store client subscriptions: clientId -> Set of pairs
  const clientSubscriptions = new Map();
  
  wss.on('connection', (ws) => {
    const clientId = generateClientId();
    clientSubscriptions.set(clientId, new Set());
    
    console.log(`Client ${clientId} connected to price stream`);
    
    // Handle incoming messages from client
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'subscribe' && Array.isArray(data.pairs)) {
          // Update client's subscription list
          const subscriptions = clientSubscriptions.get(clientId);
          data.pairs.forEach(pair => subscriptions.add(pair));
          
          console.log(`Client ${clientId} subscribed to:`, data.pairs);
          
          // Send initial prices for subscribed pairs
          const initialPrices = priceService.getMultiplePrices(data.pairs);
          ws.send(JSON.stringify({
            type: 'initial',
            data: initialPrices
          }));
        } else if (data.type === 'unsubscribe' && Array.isArray(data.pairs)) {
          // Remove pairs from subscription
          const subscriptions = clientSubscriptions.get(clientId);
          data.pairs.forEach(pair => subscriptions.delete(pair));
          
          console.log(`Client ${clientId} unsubscribed from:`, data.pairs);
        } else if (data.type === 'subscribe_all') {
          // Subscribe to all available pairs
          const allPairs = priceService.getAllPairNames();
          const subscriptions = clientSubscriptions.get(clientId);
          allPairs.forEach(pair => subscriptions.add(pair));
          
          console.log(`Client ${clientId} subscribed to all pairs`);
          
          // Send all prices
          ws.send(JSON.stringify({
            type: 'initial',
            data: priceService.getAllPrices()
          }));
        }
      } catch (err) {
        console.error('Error parsing client message:', err);
      }
    });
    
    // Broadcast updates only for subscribed pairs
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const subscriptions = clientSubscriptions.get(clientId);
        
        if (subscriptions && subscriptions.size > 0) {
          const subscribedPairs = Array.from(subscriptions);
          const prices = priceService.getMultiplePrices(subscribedPairs);
          
          // Only send if there's data
          if (Object.keys(prices).length > 0) {
            ws.send(JSON.stringify({
              type: 'update',
              data: prices
            }));
          }
        }
      }
    }, 1000);
    
    ws.on('close', () => {
      clearInterval(interval);
      clientSubscriptions.delete(clientId);
      console.log(`Client ${clientId} disconnected`);
    });
    
    ws.on('error', (err) => {
      console.error(`Client ${clientId} error:`, err);
    });
  });
  
  console.log('Price WebSocket server initialized with subscription support');
}

// Generate unique client ID
function generateClientId() {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = setupPriceSocket;
