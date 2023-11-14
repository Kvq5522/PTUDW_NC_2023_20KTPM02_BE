import { Global, Injectable } from '@nestjs/common';

import { initializeApp } from 'firebase/app';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

import { uuid as v4 } from 'uuidv4';

@Global()
@Injectable()
export class FirebaseService {
  private firebaseJson = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    projectId: process.env.FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
  };

  private app: any = initializeApp(this.firebaseJson);
  private storage: any = getStorage(this.app);

  constructor() {}

  async uploadFile(
    file: any,
    path: string,
    type: string,
  ): Promise<string | null> {
    try {
      const metadata = {
        contentType: file.mimetype,
      };
      switch (type) {
        case 'image':
          const imageRef = ref(this.storage, `images/${path}/${v4()}`);
          await uploadBytes(imageRef, file.buffer, metadata);
          return await getDownloadURL(imageRef);
        case 'file':
          const fileRef = ref(this.storage, `files/${path}`);
          await uploadBytes(fileRef, file.buffer, metadata);
          return await getDownloadURL(fileRef);
        default:
          throw new Error('Invalid type');
      }
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async deleteFile(downloadURL: string): Promise<boolean> {
    const path = decodeURIComponent(downloadURL.split('/o/')[1]).split('?')[0];

    try {
      const fileRef = ref(this.storage, path);

      await deleteObject(fileRef);

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}
