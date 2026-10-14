declare module "firebase/app" {
  export function initializeApp(config: any, name?: string): any;
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
  export function signInWithEmailAndPassword(auth: any, email: string, password: string): Promise<any>;
  export function createUserWithEmailAndPassword(auth: any, email: string, password: string): Promise<any>;
  export function signInWithPopup(auth: any, provider: any): Promise<any>;
  export class GoogleAuthProvider {
    constructor();
    setCustomParameters(params: any): void;
  }
  export function signOut(auth: any): Promise<void>;
  export function onAuthStateChanged(auth: any, callback: (user: any) => void): () => void;
  export function updateProfile(user: any, profile: { displayName?: string; photoURL?: string }): Promise<void>;
  export function sendPasswordResetEmail(auth: any, email: string): Promise<void>;
}
