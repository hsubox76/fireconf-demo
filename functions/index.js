const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

exports.updateTest = functions.https.onRequest(async (request, response) => {
  const stockMap = {};
  const cSnap = await admin.firestore().collection('historical').get();
  const batch = admin.firestore().batch();
  cSnap.forEach(docSnap => {
    const symbol = docSnap.id;
    if (!docSnap.data()) { return; }
    const dataPoint = docSnap.data().timeSeries[request.query.index || 0];
    stockMap[symbol] = dataPoint;
    const ref = admin.firestore().doc(`current/${symbol}`);
    batch.set(ref, stockMap[symbol]);
    if (Object.keys(stockMap).length === cSnap.size) {
        batch.commit();
        response.send('ok');
    }
  });
});

exports.updateStocks = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
  const stockMap = {};
  const currentDataRef = admin.firestore().doc('metadata/currentData');
  const currentDataSnap = await currentDataRef.get();
  const { index, maxIndex } = currentDataSnap.data();
  const cSnap = await admin.firestore().collection('historical').get();
  const batch = admin.firestore().batch();
  cSnap.forEach(docSnap => {
    const symbol = docSnap.id;
    if (!docSnap.data()) { return; }
    const dataPoint = docSnap.data().timeSeries[index || 1];
    const previousDataPoint = docSnap.data().timeSeries[index - 1];
    const delta = dataPoint.closeValue - previousDataPoint.closeValue;
    stockMap[symbol] = Object.assign({ delta }, dataPoint);
    const ref = admin.firestore().doc(`current/${symbol}`);
    batch.set(ref, stockMap[symbol]);
    if (Object.keys(stockMap).length === cSnap.size) {
      let newIndex = index + 1;
      if (newIndex > maxIndex) {
        newIndex = 1;
      }
      batch.update(currentDataRef, { index: newIndex });
      batch.commit();
    }
  });
});