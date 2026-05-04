const WebSocket = require('ws');
const priceService = require('../services/priceService');

function setupPriceSocket(server) {
  const wss = new WebSocket.Server({ server, path: '/ws/prices' });
  
  wss.on('connection', (ws) => {
    console.log('Client connected to price stream');
    
    ws.send(JSON.stringify(priceService.getAllPrices()));
    
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(priceService.getAllPrices()));
      }
    }, 1000);
    
    ws.on('close', () => {
      clearInterval(interval);
    });
  });
}

module.exports = setupPriceSocket;
