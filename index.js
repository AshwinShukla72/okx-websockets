import WebSocket from "ws";
import config from "./config.js";
import { booksResponseFormatter, candlesticksDataFormatter, logsWriter, snapShotMapper, tradesDataFormatter, updateOrderBook, convertToSnapshot } from "./helpers.js";
const { platformWebsocketsBasePath: { okxWsPublic, okxWsBusiness }} = config

let initialSnapShot = []

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
    const chosenInstId = 'KLAY-USDT';
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
          if (parsedData.arg?.channel === 'books') {
            // let res = booksResponseFormatter(parsedData)

            // TODO: Handle snapshot mechanism 
            if (parsedData.action === 'snapshot') {
              initialSnapShot = snapShotMapper(parsedData)
            } else if (parsedData.action === 'update') {
              if (!Array.isArray(initialSnapShot)) {
                let updatedOrderBook = updateOrderBook(initialSnapShot, parsedData)
                logsWriter(convertToSnapshot(updatedOrderBook), 'updatedSnaps.json')
              }
            }
          } 
        // else if (parsedData.arg?.channel === 'candle1D') logsWriter(candlesticksDataFormatter(parsedData), 'candle1D.txt') 
        //   else if (parsedData.arg?.channel === 'candle1s') logsWriter(candlesticksDataFormatter(parsedData), 'candle1s.txt')
        //   else if (parsedData.arg?.channel === 'trades') logsWriter(tradesDataFormatter(parsedData), 'trades.txt')
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
  // await subscribeToWsChannels(['books', 'trades'], okxWsPublic) // ], okxWsPublic)
  // await subscribeToWsChannels(['candle1D', 'candle1s'], okxWsBusiness)
} catch (error) {
  console.log(error)
}