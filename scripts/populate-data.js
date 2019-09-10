const https = require('https');
const admin = require('firebase-admin');
const { STOCK_LIST } = require('./stocks-list');

admin.initializeApp({
  // Requires service key stored in env variable.
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://exchange-rates-adcf6.firebaseio.com"
});

const AV_API_KEY = "OZSR3ISSNF8FS7MO";
const TIME_SERIES_GROUP_NAME = "Time Series";
const CLOSE_FIELD = '4. close';
const GROUP_SIZE = process.argv[3] || 5;
let totalStocksFetched = 0;

if (process.argv[2]) {
  runBatch(parseInt(process.argv[2], 10), false);
} else {
  runBatch(0, true);
}

function runBatch(batchIndex = 0, runAgain = false) {
  const segment = batchIndex;
  const startIndex = segment * GROUP_SIZE;
  const endIndex = startIndex + GROUP_SIZE;
  const stocksToQuery = STOCK_LIST.slice(startIndex, endIndex);
  stocksToQuery.forEach((symbol) => getStockPrice(symbol, '1min'));

  function getStockPrice(symbol, intervalString) {
    const queryParams = {
      function: "TIME_SERIES_INTRADAY",
      symbol,
      interval: intervalString,
      outputsize: 'full',
      apikey: AV_API_KEY
    }

    const queryStringPairs = [];
    for (const key in queryParams) {
      queryStringPairs.push(`${key}=${queryParams[key]}`);
    }

    console.log('Query: ' + '/query?' + queryStringPairs.join('&'));

    const options = {
      hostname: 'www.alphavantage.co',
      port: 443,
      path: '/query?' + queryStringPairs.join('&'),
      method: 'GET'
    };

    const req = https.request(options, res => {
      let data;
      console.log(`statusCode: ${res.statusCode}`)
    
      res.on('data', d => {
        if (!data) {
          data = d;
        } else {
          data += d;
        }
      });

      res.on('end', async () => {
        const result = JSON.parse(data);
        const timeSeriesObject = result[TIME_SERIES_GROUP_NAME + ` (${intervalString})`];
        let timeSeries = Object.keys(timeSeriesObject).map(key => {
          const timestamp = new Date(key).valueOf();
          const closeValue = Number(timeSeriesObject[key][CLOSE_FIELD]);
          return { timestamp, closeValue };
        });
        timeSeries = timeSeries.filter(dataPoint => {
          const dateObj = new Date(dataPoint.timestamp);
          if (dateObj.getMonth() === 7 && dateObj.getDate() === 28) {
            return true;
          }
          return false;
        });
        timeSeries.sort((a, b) => {
          if (a.timestamp < b.timestamp) return -1;
          if (a.timestamp > b.timestamp) return 1;
          return 0;
        });
        await admin.firestore().doc(`historical/${symbol}`).delete();
        await admin.firestore().doc(`historical/${symbol}`)
          .set({ timeSeries: timeSeries.slice(0, 390) });
        totalStocksFetched++;
        console.log('Finished fetching', symbol);
        if (totalStocksFetched === STOCK_LIST.length) {
          process.exit();
        }
      })
    })
    
    req.on('error', error => {
      console.error(error);
    })
    
    req.end();
  }

  if (runAgain && ((batchIndex + 1) * GROUP_SIZE) < STOCK_LIST.length) {
    console.log('running', (batchIndex + 1) * GROUP_SIZE, 'to', (batchIndex + 2) * GROUP_SIZE, 'after 65 seconds');
    setTimeout(() => runBatch(batchIndex + 1, true), 65000);
  }
}