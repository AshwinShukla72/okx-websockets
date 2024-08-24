import {fromUnixTime, format} from 'date-fns';
import path from 'node:path';
import { existsSync, mkdirSync, appendFile } from 'node:fs'

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
      klineUncompleted: Boolean(confirmed) || 0,
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

export const logsWriter = (response, logFileName = 'wslogs.txt') => {
  const functionName = "logsWriter"
  try {
    if (!response) return null;
    // Create logs directory if not present
    const directory = './logs'
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
