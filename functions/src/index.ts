import * as functions from 'firebase-functions';
import { ServiceAccount, cert, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import serviceAccount from '../serviceAccountKey.json';
import dayjs from 'dayjs';
const puppeteer = require('puppeteer');

// // Start writing functions
// https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

exports.getHeadlines = functions
  .runWith({ memory: '1GB' })
  .pubsub.schedule('0 8 * * *')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    initializeApp({
      credential: cert(serviceAccount as ServiceAccount),
      storageBucket: 'headline-archive-d5101.appspot.com',
    });

    console.log('initialized app');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    console.log('launched browser');

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    console.log('new page and viewport');

    await page.goto('https://www.cnn.com/', {
      waitUntil: 'networkidle2',
      timeout: 0,
    });

    console.log('Went to CNN');

    const CNN_Screenshot = await page.screenshot({
      encoding: 'binary',
    });
    console.log('took screenshot of CNN');

    await page.goto('https://www.foxnews.com/', {
      waitUntil: 'networkidle2',
      timeout: 0,
    });

    console.log('Went to FOX');

    const FOX_Screenshot = await page.screenshot({
      encoding: 'binary',
    });
    console.log('took screenshot of FOX');

    const MMDDYYYY = dayjs().format('MMDDYYYY');

    const bucket = getStorage().bucket();

    console.log('got the bucket');

    await bucket
      .file(`images/${MMDDYYYY}/CNN_screenshot.jpg`)
      .save(CNN_Screenshot);

    console.log('uploaded CNN to bucket');

    await bucket
      .file(`images/${MMDDYYYY}/FOX_screenshot.jpg`)
      .save(FOX_Screenshot);

    console.log('uploaded FOX to bucket');

    await browser.close();
    console.log('browser closed');

    console.log('This will be run every day at 8:00 AM Eastern!');
    return null;
  });
