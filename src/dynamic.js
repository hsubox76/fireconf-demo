import { firebaseConfigDynamic as firebaseConfig } from "./shared/firebase-config";
import { renderPage, logPerformance } from "./shared/helpers";

let firstLoad = false;

// Firestore REST URL for "current" collection.
const COLLECTION_URL =
  `https://firestore.googleapis.com/v1/projects/exchange-rates-adcf6/` +
  `databases/(default)/documents/current`;







// STEPS
// 1) Fetch REST data
// 2) Render data
// 3) Import Firebase components
// 4) Subscribe to Firestore






// HTTP GET from Firestore REST endpoint.
fetch(COLLECTION_URL).then(res => res.json())
  .then(json => {
    // Format JSON data into a tabular format.
    const stocks = formatJSONStocks(json);

    // Measure time between navigation start and now (first data loaded)
    performance && performance.measure('initialDataLoadTime');

    // Render using initial REST data.
    renderPage({
      title: "Dynamic Loading (no Firebase loaded)",
      tableData: stocks
    });

    // Import Firebase library.
    dynamicFirebaseImport().then(firebase => {
      firebase.initializeApp(firebaseConfig);
      firebase.performance(); // Use Firebase Performance - 1 line
      subscribeToFirestore(firebase);
    });
  });








/**
 * FUNCTIONS
 */

// Dynamically imports firebase/app, firebase/firestore, and firebase/performance.
function dynamicFirebaseImport() {
  const appImport = import(/* webpackChunkName: "firebase-app-dynamic" */ "firebase/app");
  const firestoreImport = import(/* webpackChunkName: "firebase-firestore-dynamic" */"firebase/firestore");
  const performanceImport = import(/* webpackChunkName: "firebase-performance-dynamic" */"firebase/performance");
  return Promise.all([appImport, firestoreImport, performanceImport]).then(
    ([dynamicFirebase]) => {
      return dynamicFirebase;
    }
  );
}

// Subscribe to "current" collection with `onSnapshot()`.
function subscribeToFirestore(firebase) {
  firebase
    .firestore()
    .collection(`current`)
    .onSnapshot(snap => {
      if (!firstLoad) {
        // Measure time between navigation start and now (first data loaded)
        performance && performance.measure('realtimeDataLoadTime');
        // Log to console for internal development
        logPerformance();
        firstLoad = true;
      }
      const stocks = formatSDKStocks(snap);
      renderPage({
        title: "Dynamic Loading (Firebase now loaded)",
        tableData: stocks
      });
    });
}

// Format stock data in JSON format (returned from REST endpoint)
function formatJSONStocks(json) {
  const stocks = [];
  json.documents.forEach(doc => {
    const pathParts = doc.name.split("/");
    const symbol = pathParts[pathParts.length - 1];
    stocks.push({
      symbol,
      value: doc.fields.closeValue.doubleValue || 0,
      delta: doc.fields.delta.doubleValue || 0,
      timestamp: parseInt(doc.fields.timestamp.integerValue)
    });
  });
  return stocks;
}

// Format stock data in Firestore format (returned from `onSnapshot()`)
function formatSDKStocks(snap) {
  const stocks = [];
  snap.forEach(docSnap => {
    if (!docSnap.data()) return;
    const symbol = docSnap.id;
    const value = docSnap.data().closeValue;
    stocks.push({
      symbol,
      value,
      delta: docSnap.data().delta,
      timestamp: docSnap.data().timestamp
    });
  });
  return stocks;
}
