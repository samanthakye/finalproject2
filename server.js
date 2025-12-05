
const WebSocket = require('ws');

// Create a WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });

console.log('Relay server started on port 8080...');

wss.on('connection', ws => {
  console.log('Client connected.');

  ws.on('message', message => {
    // When a message is received, log it and broadcast it to all other clients
    console.log('Received:', message.toString());

    wss.clients.forEach(client => {
      // Check if the client is not the sender and is ready to receive messages
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected.');
  });

  ws.on('error', error => {
    console.error('WebSocket error:', error);
  });
});
