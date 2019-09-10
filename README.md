# fireconf-demo

Fake "stock market" app to demonstrate how to improve performance of a
Firebase web app, created for Firebase Summit 2019.

## Key Files
- [full.js](src/full.js) - Naive implementation that imports full Firebase all-in-one package.
- [split.js](src/split.js) - Imports only necessary Firebase components (Firestore and Performance) - halves the bundle size.
- [dynamic.js](src/dynamic.js) - Fetches initial data with REST call and then dynamically imports Firebase libraries.