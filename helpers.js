import {fromUnixTime, format} from 'date-fns';
import path from 'node:path';
import {existsSync, mkdirSync, appendFile} from 'node:fs';

// asks formatter ---------------
export const asksFormatter = (asks) => {
  const functionName = 'asksFormatter';
  try {
    return asks.map(([price, quantity, , orderId]) => ({
      price: Number(price),
      quantity: Number(quantity),
      orderId: Number(orderId),
    }));
  } catch (error) {
    console.log(`Error in ${functionName} -->`, error);
  }
};

// bids ---------------------
export const bidsFormatter = (bids) => {
  const functionName = 'bidsFormatter';
  try {
    return bids.map(([price, quantity, , orderId]) => ({
      price: Number(price),
      quantity: Number(quantity),
      orderId: Number(orderId),
    }));
  } catch (error) {
    console.log(`Error in ${functionName} -->`, error);
  }
};
export const candlesticksDataFormatter = (response = {}) => {
  const functionName = 'candlesticksDataFormatter';
  try {
    if (Object.keys(response) === 0) return null;
    const {data} = response;
    if (!Array.isArray(data) || data.length == 0) return null;

    const requiredData = data[0];
    const [
      timestamp,
      openPrice,
      highestPrice,
      lowestPrice,
      closingPrice,
      volume,
      volumeCurrency,
      volumeCurrencyQuote,
      confirmed,
    ] = requiredData;

    return {
      timestamp,
      openPrice: Number(openPrice) || 0,
      highestPrice: Number(highestPrice) || 0,
      lowestPrice: Number(lowestPrice) || 0,
      closingPrice: Number(closingPrice) || 0,
      volume: Number(volume) || 0,
      volumeCurrency: Number(volumeCurrency) || 0,
      volumeCurrencyQuote: Number(volumeCurrencyQuote) || 0,
      klineIscompleted: Boolean(confirmed) || 0,
    };
  } catch (error) {
    console.log(`Error in ${functionName} -->`, error);
  }
};

// ! valid timestamp format ?
export const timestampFormatter = (timestamp, dateFormat = 'DD-MM-YYYY HH:mm:ss') => {
  const functionName = 'timestampFormatter';
  try {
    const seconds = Math.floor(timestamp / 1000);
    return format(fromUnixTime(seconds), dateFormat);
  } catch (error) {
    console.log(`Error in ${functionName} -->`, error);
  }
};

// --- format books ws Data
export const booksResponseFormatter = (response = {}) => {
  const functionName = 'booksResponseFormatter';
  try {
    if (Object.keys(response) === 0) return null;
    const {data} = response;
    // Add checks for checking data array
    if (!Array.isArray(data) || data.length == 0) {
      return null;
    }
    // collect bookdata
    let requiredData = data[0];
    return {
      action: response.action,
      channel: response.arg.channel,
      instrumentId: response.arg.instId,
      instAsks: asksFormatter(requiredData.asks),
      instBids: bidsFormatter(requiredData.bids),
      timestamp: requiredData.timestamp,
      prevSeqId: requiredData.prevSeqId,
      currentSeqId: requiredData.seqId,
      checksum: requiredData.checksum,
    };
  } catch (error) {
    console.log(`Error in ${functionName} -->`, error);
  }
};

export const tradesDataFormatter = (response = {}) => {
  const functionName = 'tradesFormatter';
  try {
    if (Object.keys(response) === 0) return null;
    const {data} = response;
    // Add checks for checking data array
    if (!Array.isArray(data) || data.length == 0) {
      return null;
    }
    const requiredData = data[0];
    return {
      instrumentId: requiredData.instId,
      tradeId: Number(requiredData.tradeId),
      tradePrice: Number(requiredData.px),
      tradeSize: Number(requiredData.sz),
      type: String(requiredData.side).toUpperCase(),
      timestamp: requiredData.timestamp,
      tradesAggregatedCount: Number(requiredData.count),
    };
  } catch (error) {
    console.log(`Error in ${functionName} -->`, error);
  }
};

export const logsWriter = (response, logFileName = 'wslogs.txt') => {
  const functionName = 'logsWriter';
  try {
    if (!response) return null;
    // Create logs directory if not present
    const directory = './logs';
    // if (!existsSync(directory)) mkdirSync(directory)
    const logsDirectory = directory;

    const logFilesPath = path.join(logsDirectory, logFileName);
    const logContent = JSON.stringify(response);

    appendFile(logFilesPath, logContent + '\n', (err) => {
      if (err) console.error('Failed to write log:', err);
      // console.log(`Writing in ${logFileName}`);
    });
  } catch (error) {
    console.log(`Error in ${functionName} -->`, error);
  }
};

export const snapShotMapper = (snapShot = {}) => {
  const functionName = 'snapShotMapper';
  try {
    if (Object.keys(snapShot).length == 0) return [];
    const {data} = snapShot;
    const {asks, bids, prevSeqId, ts, checksum, seqId} = data[0];
    if (prevSeqId != -1) return [];

    // Create Order Book
    let orderBook = {
      asks: new Map(),
      bids: new Map(),
    };
    orderBook.asks.clear();
    orderBook.bids.clear();
    // populate asks in order book
    for (let ask of asks) {
      const [price, size, , orderId] = ask;
      orderBook.asks.set(price, {size, orderId});
    }
    // populate bids in order book
    for (let bid of bids) {
      const [price, size, , orderId] = bid;
      orderBook.bids.set(price, {size, orderId});
    }
    // Custom orderBid
    // orderBook.bids.set('0.1701', {size: '12', orderId: '123'})
    // orderBook.bids.set('0.16842', {size: '10202.12', orderId: '123'})

    return {...orderBook, ts, checksum, prevSeqId, seqId};
  } catch (error) {
    console.log(`Error in ${functionName} -->`, error);
  }
};

export const convertToSnapshot = (orderBook = {}) => {
  let asks = [],
    bids = [];
  const {prevSeqId, ts, checksum, seqId} = orderBook;
  if (Object.keys(orderBook).length === 0) return '';
  for (let [price, {size, orderId}] of orderBook.asks) {
    asks.push([price, size, '0', orderId]);
  }
  for (let [price, {size, orderId}] of orderBook.bids) {
    bids.push([price, size, '0', orderId]);
  }

  return {prevSeqId, ts, checksum, seqId, asks, bids};
};

export const updateOrderBook = (orderBook = {}, updates = {}) => {
  const functionName = 'updateOrderBook';
  try {
    const currentOrderBook = orderBook;
    // Initial Checks -->
    if (Object.keys(currentOrderBook).length === 0 || Object.keys(updates).length === 0) return null;
    const {data} = updates;
    if (data.length === 0) return null;
    const {asks, bids} = data[0];

    // Asks loop
    if (asks.length > 0) {
      for (let [price, size, , orderId] of asks) {
        if (size === '0') {
          logsWriter(`Deleting Ask: ${price}, ${JSON.stringify(currentOrderBook.asks.get(price))}`, 'asks.txt');
          currentOrderBook.asks.delete(price);
        } else {
          currentOrderBook.asks.set(price, {size, orderId});
          logsWriter(`Updating/Adding Ask: ${price}, ${JSON.stringify(currentOrderBook.asks.get(price))}`, 'asks.txt');
        }
      }
    }

    // Bids loop
    if (bids.length > 0) {
      for (let [price, size, , orderId] of bids) {
        if (size === '0') {
          logsWriter(`Deleting Bid: ${price}, ${JSON.stringify(currentOrderBook.bids.get(price))}`, 'bids.txt');
          currentOrderBook.bids.delete(price);
        } else {
          currentOrderBook.bids.set(price, {size, orderId});
          logsWriter(`Updating/Adding Bid: ${price}, ${JSON.stringify(currentOrderBook.bids.get(price))}`, 'bids.txt');
        }
      }
    }
    // Sort the order books
    currentOrderBook.asks = new Map([...currentOrderBook.asks].sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])));

    currentOrderBook.bids = new Map([...currentOrderBook.bids].sort((a, b) => parseFloat(b[0]) - parseFloat(a[0])));

    return currentOrderBook;
  } catch (error) {
    console.log(`Error in ${functionName} -->`, error);
  }
};
