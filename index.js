import WebSocket from "ws";
import config from "./config.js";
import { booksResponseFormatter, candlesticksDataFormatter, logsWriter } from "./helpers.js";
const { platformWebsocketsBasePath: { okxWsPublic, okxWsBusiness }} = config


export const subscribeToWsChannels = async (channels = [], url) => {
  try {
    if (channels.length == 0) {
      throw new Error("Channels not shared")
    }
    
    const ws = new WebSocket(url)
    const sendPing = () =>  {
      ws.ping()
      console.log("ping sent")
    }
    const chosenInstId = 'BTC-USDT';
    const subscriptionChannels = channels.map(e => ({ channel: e, instId: chosenInstId }));

    ws.on('open', () => {
      console.log('Connected to OKX WebSocket server');
      const subscriptionMessage = JSON.stringify({
        op: 'subscribe',
        args: [...subscriptionChannels],
      });
      console.log("Subscribing", subscriptionMessage)
      ws.send(subscriptionMessage);
      // Sending ping every 3 minutes
      setInterval(sendPing, 3 * 60 * 1000);
    });

    ws.on('message', data => {
      let parsedData = {...JSON.parse(JSON.stringify(JSON.parse(data)))}
      
        if (parsedData.arg != null) {
          if (parsedData.arg?.channel == 'books') {
            logsWriter(booksResponseFormatter(parsedData), 'bookslog.txt')
          } else if (parsedData.arg?.channel == 'candle1D') {
            logsWriter(candlesticksDataFormatter(parsedData), 'candle1D.txt')
          }
        }
 

    })

    ws.on('error', error => {
      console.error('OKX WebSocket error:', error);
    });

    ws.on('close', () => {
      console.log('Disconnected from OKX WebSocket server');
    });

  } catch (error) {
    console.error('Error setting up Websocket subscription:', error);
  }
}

try {
  await subscribeToWsChannels(['books'], okxWsPublic) // ], okxWsPublic)
  await subscribeToWsChannels(['candle1D'], okxWsBusiness)
} catch (error) {
  console.log(error)
}