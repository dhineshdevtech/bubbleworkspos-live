declare module "firebase/app" {
  export function initializeApp(config: any): any;
  export function getApps(): any[];
  export function getApp(): any;
}

declare module "firebase/firestore" {
  export function getFirestore(app?: any): any;
  export function collection(firestore: any, ...pathSegments: string[]): any;
  export function doc(firestore: any, ...pathSegments: string[]): any;
  export function getDoc(docRef: any): Promise<any>;
  export function getDocs(query: any): Promise<any>;
  export function setDoc(docRef: any, data: any, options?: any): Promise<void>;
  export function updateDoc(docRef: any, data: any): Promise<void>;
  export function deleteDoc(docRef: any): Promise<void>;
  export function query(collectionRef: any, ...queryConstraints: any[]): any;
  export function where(fieldPath: string, opStr: any, value: any): any;
  export function orderBy(fieldPath: string, directionStr?: string): any;
  export function limit(limitNum: number): any;
  export class Timestamp {
    static now(): Timestamp;
    toDate(): Date;
    toMillis(): number;
  }
}

declare module "firebase/auth" {
  export function getAuth(app?: any): any;
}
