 const puppeteer = require('puppeteer');
 
 const TIMEOUT_AFTER_LOAD = 10000;
 const DEFAULT_VIEWPORT = {width: 1000, height: 800, deviceScaleFactor: 1};

 const routes = [
     'full',
     'split',
     'dynamic'
 ];
 
 const argv = require('yargs')
   .options({
     'latencyRange': {
       alias: 'l',
       describe: 'Range of latency used in generating random network conditions, in ms',
       default: 0-500,
     },
     'downloadSpeedRange': {
       alias: 'd',
       describe: 'Range of download speed used in generating random network conditions, in Kbps',
       default: 400-50000,
     },
   })
   .help()
   .wrap(null)
   .argv;

  const [ latencyMin, latencyMax ] = argv.latencyRange.split('-');
  const [ speedMin, speedMax ] = argv.downloadSpeedRange.split('-');
 
 const sleep = (timeout) => new Promise(r => setTimeout(r, timeout));

 function mapTo(seed, start, end) {
   return Number(start) + (seed * (Number(end) - Number(start)));
 }

 function generateNetworkConditions() {
   const seed = Math.random();
   const downloadKbps = mapTo(seed, speedMin, speedMax);
   const uploadKbps = mapTo(seed, speedMin, speedMax);
   const conditions = {
    offline: false,
    latency: mapTo(seed, latencyMax, latencyMin),
    downloadThroughput: Math.floor(downloadKbps * 1024 / 8), // 400 Kbps
    uploadThroughput: Math.floor(uploadKbps * 1024 / 8) // 400 Kbps
  };
  console.log('latency:', Math.round(conditions.latency),
    '| download:', Math.round(downloadKbps),
    '| upload:', Math.round(uploadKbps));
  return conditions;
 }
 
 async function launch(networkConditions) {
 
   const browser = await puppeteer.launch({
     headless: true,
     args: [
       `--window-size=${DEFAULT_VIEWPORT.width},${DEFAULT_VIEWPORT.height}`,
     ],
   });
 
   const page = await browser.newPage();
 
   const client = await page.target().createCDPSession();
   // Emulate "Slow 3G" according to WebPageTest.
   await client.send('Network.emulateNetworkConditions', networkConditions);
 
   return page;
 }

 async function loadRoute(routeIndex, networkConditions) {
 
  const launchedPage = await launch(networkConditions);
  
  const start = Date.now();
 
  const url = 'https://exchange-rates-adcf6.firebaseapp.com/'
      + routes[routeIndex] + '.html';
  
  const waitForPage = async () => {
    return launchedPage.goto(url, {waitUntil: 'load'})
        .then(() => Date.now());
  };
  
  const stopTime = await waitForPage();
  // console.log(`Page took ${stopTime - start} ms to load`);

  const loadEventEnd = await launchedPage.evaluate(_ => {
    return window.performance.timing.loadEventEnd
      - window.performance.timing.navigationStart;
  });
  console.log(`LoadEventEnd for /${routes[routeIndex]}.html was ${loadEventEnd} ms`);
  
  await sleep(TIMEOUT_AFTER_LOAD);
  
  await launchedPage.browser().close();

 }
 
 (async () => {
 
  let count = 0;
  console.log('round', count, 'at', new Date().toLocaleString());
  let routeIndex = 0;
  let networkConditions = generateNetworkConditions();

  while (true) {
    await loadRoute(routeIndex, networkConditions);
    routeIndex++;
    if (routeIndex >= routes.length) {
      count++;
      console.log('round', count, 'at', new Date().toLocaleString());
      routeIndex = 0;
      networkConditions = generateNetworkConditions();
    }
  }
 
 })();
 