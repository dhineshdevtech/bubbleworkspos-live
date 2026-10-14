import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { db, auth } from "./firebase";
import type {
  ApiSession,
  Branch,
  User,
  Service,
  Product,
  ItemCategory,
  ServiceRate,
  AddOn,
  GlobalSettings,
  Customer,
  CustomerProfile,
  Order,
} from "./api";
import type { CreateOrderInput } from "@bubbleworks/shared";

// =========================================================================
// Default Initial Data Seeds (automatically populated if Firestore is empty)
// =========================================================================

const DEFAULT_BRANCH_ID = "branch-main";
const DEFAULT_BRANCH: Branch = {
  id: DEFAULT_BRANCH_ID,
  name: "Bubbleworks Flagship Store",
  code: "BW01",
  address: "123 Main Commercial Road, City Center",
  mobile: "9876543210",
  status: "ACTIVE",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const DEFAULT_SETTINGS: GlobalSettings = {
  id: "global-settings",
  businessName: "Bubbleworks Laundry & Dry Cleaners",
  logoUrl: null,
  address: "123 Main Commercial Road, City Center",
  mobile: "9876543210",
  gstNumber: "33AAAAA0000A1Z5",
  defaultGstRate: 18,
  printerSize: "MM_80",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const DEFAULT_CATEGORIES: ItemCategory[] = [
  { id: "cat-men", name: "Menswear", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "cat-women", name: "Womenswear", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "cat-household", name: "Household & Linens", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "cat-winter", name: "Winterwear", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const DEFAULT_SERVICES: Service[] = [
  { id: "srv-dryclean", name: "Dry Cleaning", description: "Premium solvent chemical cleaning", status: "ACTIVE", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "srv-washfold", name: "Wash & Fold", description: "Everyday laundry washed and neatly folded", status: "ACTIVE", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "srv-steamiron", name: "Steam Press", description: "Crisp wrinkle-free steam ironing", status: "ACTIVE", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "srv-shoespa", name: "Shoe & Sneaker Spa", description: "Deep cleaning for shoes and leather", status: "ACTIVE", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const DEFAULT_PRODUCTS: Product[] = [
  { id: "prod-shirt", name: "Formal Shirt", description: "Men/Women shirt", status: "ACTIVE", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-tshirt", name: "T-Shirt / Polo", description: "Casual tops", status: "ACTIVE", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-trousers", name: "Trousers / Jeans", description: "Pants and bottoms", status: "ACTIVE", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-saree", name: "Saree (Silk/Designer)", description: "Traditional sarees", status: "ACTIVE", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-blazer", name: "Blazer / Suit (2 Pc)", description: "Formal suits", status: "ACTIVE", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-bedsheet", name: "Bedsheet (Double)", description: "Bed linens", status: "ACTIVE", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const DEFAULT_RATES: ServiceRate[] = [
  { id: "rate-1", serviceId: "srv-dryclean", productId: "prod-shirt", categoryId: "cat-men", unit: "piece", rate: 80, gstRate: 18, status: "ACTIVE", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "rate-2", serviceId: "srv-steamiron", productId: "prod-shirt", categoryId: "cat-men", unit: "piece", rate: 25, gstRate: 18, status: "ACTIVE", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "rate-3", serviceId: "srv-dryclean", productId: "prod-trousers", categoryId: "cat-men", unit: "piece", rate: 90, gstRate: 18, status: "ACTIVE", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "rate-4", serviceId: "srv-dryclean", productId: "prod-saree", categoryId: "cat-women", unit: "piece", rate: 180, gstRate: 18, status: "ACTIVE", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "rate-5", serviceId: "srv-dryclean", productId: "prod-blazer", categoryId: "cat-men", unit: "piece", rate: 250, gstRate: 18, status: "ACTIVE", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "rate-6", serviceId: "srv-washfold", productId: null, categoryId: null, unit: "kg", rate: 70, gstRate: 18, status: "ACTIVE", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const DEFAULT_ADDONS: AddOn[] = [
  { id: "addon-stain", name: "Stain Removal Treatment", rate: 50, unit: "piece", status: "ACTIVE", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "addon-starch", name: "Starch Finish", rate: 30, unit: "piece", status: "ACTIVE", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "addon-fragrance", name: "Aroma Fragrance Spa", rate: 40, unit: "order", status: "ACTIVE", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "addon-express", name: "Express Same-Day Priority", rate: 150, unit: "order", status: "ACTIVE", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

let seededPromise: Promise<void> | null = null;

export async function ensureFirebaseSeeded(): Promise<void> {
  if (seededPromise) return seededPromise;

  seededPromise = (async () => {
    try {
      const settingsRef = doc(db, "settings", "global-settings");
      const snap = await getDoc(settingsRef);
      if (snap.exists()) return;

      // Seed settings
      await setDoc(settingsRef, DEFAULT_SETTINGS);

      // Seed default branch
      await setDoc(doc(db, "branches", DEFAULT_BRANCH_ID), DEFAULT_BRANCH);

      // Seed categories
      for (const cat of DEFAULT_CATEGORIES) {
        await setDoc(doc(db, "categories", cat.id), cat);
      }

      // Seed services
      for (const srv of DEFAULT_SERVICES) {
        await setDoc(doc(db, "services", srv.id), srv);
      }

      // Seed products
      for (const prod of DEFAULT_PRODUCTS) {
        await setDoc(doc(db, "products", prod.id), prod);
      }

      // Seed rates
      for (const rate of DEFAULT_RATES) {
        await setDoc(doc(db, "rates", rate.id), rate);
      }

      // Seed add-ons
      for (const addon of DEFAULT_ADDONS) {
        await setDoc(doc(db, "addons", addon.id), addon);
      }

      // Initial seed complete
    } catch (err) {
      console.warn("Firestore seed check notice:", err);
    }
  })();

  return seededPromise;
}

// Helper to generate IDs
export function generateId(prefix = "id"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// =========================================================================
// 1. Authentication (Real Firebase Auth + Firestore User Profiles)
// =========================================================================


async function resolveFirebaseUserProfile(
  fbUser: any,
  token: string,
  defaultRole: "ADMIN" | "CASHIER" = "ADMIN",
  overrideName?: string
): Promise<ApiSession> {
  const uid = fbUser.uid;
  const email = (fbUser.email || "").toLowerCase();
  const displayName = overrideName || fbUser.displayName || (email ? email.split("@")[0] : "Admin User");

  let userData: any = null;

  // Safely query user profile from Firestore without failing if permissions are strict
  try {
    const userDocRef = doc(db, "users", uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      userData = userSnap.data();
    } else {
      if (email) {
        try {
          const q = query(collection(db, "users"), where("email", "==", email));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            userData = qSnap.docs[0].data();
            await setDoc(userDocRef, { ...userData, id: uid, uid }, { merge: true });
          }
        } catch {
          // Ignore
        }
      }

      if (!userData) {
        userData = {
          id: uid,
          uid: uid,
          name: displayName,
          username: email || displayName,
          email: email,
          role: defaultRole,
          branchId: DEFAULT_BRANCH_ID,
          status: "ACTIVE",
          avatarUrl: fbUser.photoURL || null,
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        try {
          await setDoc(userDocRef, userData);
        } catch {
          // Ignore permission restriction
        }
      }
    }
  } catch (err) {
    console.warn("Firestore user sync notice (using auth profile directly):", err);
  }

  // Safe fallback if Firestore profile could not be read
  if (!userData) {
    userData = {
      id: uid,
      name: displayName,
      username: email || displayName,
      role: defaultRole,
      branchId: DEFAULT_BRANCH_ID,
      status: "ACTIVE",
    };
  }

  if (userData.status === "DISABLED") {
    throw new Error("Your user account has been deactivated. Please contact your manager.");
  }

  let branch = { id: DEFAULT_BRANCH.id, name: DEFAULT_BRANCH.name, code: DEFAULT_BRANCH.code };
  const branchId = userData.branchId || DEFAULT_BRANCH_ID;
  try {
    const bSnap = await getDoc(doc(db, "branches", branchId));
    if (bSnap.exists()) {
      const bData = bSnap.data();
      branch = { id: branchId, name: bData.name, code: bData.code };
    }
  } catch {
    // Keep default branch
  }

  return {
    token: token || `fb_token_${uid}`,
    user: {
      id: uid,
      name: userData.name || displayName,
      username: userData.username || email || displayName,
      role: (userData.role as "ADMIN" | "CASHIER") || "ADMIN",
      branchId: branchId,
      branch,
    },
  };
}

export async function fbLogin(input: { username: string; password: string }): Promise<ApiSession> {
  const trimmed = input.username.trim();
  if (!trimmed || !input.password) {
    throw new Error("Please enter your email and password.");
  }

  const isEmail = trimmed.includes("@");
  const emailToUse = isEmail ? trimmed.toLowerCase() : `${trimmed.toLowerCase()}@bubbleworks.com`;

  // 1. Attempt Real Firebase Authentication (Email/Password)
  try {
    const cred = await signInWithEmailAndPassword(auth, emailToUse, input.password);
    const token = await cred.user.getIdToken();
    const session = await resolveFirebaseUserProfile(cred.user, token);
    ensureFirebaseSeeded().catch(() => {});
    return session;
  } catch (authErr: any) {
    const errCode = authErr?.code || "";

    if (errCode === "auth/wrong-password" || errCode === "auth/invalid-credential") {
      throw new Error("Invalid email or password.");
    }
    if (errCode === "auth/user-disabled") {
      throw new Error("This account has been disabled in Firebase Authentication.");
    }
    if (errCode === "auth/too-many-requests") {
      throw new Error("Access temporarily locked due to multiple failed login attempts. Try again later.");
    }
  }

  // 3. Query Firestore users collection (for cashiers)
  try {
    const q = query(collection(db, "users"), where("username", "==", trimmed));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const userDoc = snap.docs[0].data();
      if (userDoc.status === "DISABLED") {
        throw new Error("User account is disabled. Contact system administrator.");
      }
      if (userDoc.password && userDoc.password !== input.password) {
        throw new Error("Invalid username or password");
      }

      let branch = null;
      if (userDoc.branchId) {
        try {
          const bSnap = await getDoc(doc(db, "branches", userDoc.branchId));
          if (bSnap.exists()) {
            const bData = bSnap.data();
            branch = { id: userDoc.branchId, name: bData.name, code: bData.code };
          }
        } catch {
          // Ignore
        }
      }

      return {
        token: `fb_token_${userDoc.id}_${Date.now()}`,
        user: {
          id: userDoc.id,
          name: userDoc.name || userDoc.username,
          username: userDoc.username,
          role: userDoc.role || "CASHIER",
          branchId: userDoc.branchId || null,
          branch,
        },
      };
    }
  } catch (err: any) {
    if (err.message && err.message.includes("User account is disabled")) throw err;
    if (err.message && err.message.includes("Invalid username or password")) throw err;
  }

  throw new Error("Invalid username or password. Please check your credentials.");
}

export async function fbLoginWithGoogle(): Promise<ApiSession> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const cred = await signInWithPopup(auth, provider);
    const token = await cred.user.getIdToken();
    const session = await resolveFirebaseUserProfile(cred.user, token, "ADMIN");
    ensureFirebaseSeeded().catch(() => {});
    return session;
  } catch (err: any) {
    console.error("Firebase Google Auth error:", err);
    if (err.code === "auth/popup-closed-by-user") {
      throw new Error("Google sign-in was cancelled.");
    }
    if (err.code === "auth/popup-blocked") {
      throw new Error("Sign-in popup was blocked by browser. Please allow popups for this site.");
    }
    if (err.code === "auth/operation-not-allowed") {
      throw new Error("Google Sign-In is not enabled yet in your Firebase Console. Please enable Google in Firebase Authentication -> Sign-in method.");
    }
    if (err.code === "auth/unauthorized-domain") {
      throw new Error("This domain is not authorized in Firebase. Please add your Vercel domain to Firebase Console -> Authentication -> Settings -> Authorized domains.");
    }
    throw new Error(err.message || "Failed to sign in with Google.");
  }
}

export async function fbRegister(input: {
  email: string;
  password: string;
  name?: string;
  role?: "ADMIN" | "CASHIER";
}): Promise<ApiSession> {
  await ensureFirebaseSeeded();
  try {
    const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
    const token = await cred.user.getIdToken();
    return await resolveFirebaseUserProfile(cred.user, token, input.role || "ADMIN", input.name);
  } catch (err: any) {
    console.error("Firebase Auth register error:", err);
    if (err.code === "auth/email-already-in-use") {
      throw new Error("An account already exists with this email address. Please sign in instead.");
    }
    if (err.code === "auth/weak-password") {
      throw new Error("Password must be at least 6 characters long.");
    }
    if (err.code === "auth/invalid-email") {
      throw new Error("Please enter a valid email address.");
    }
    if (err.code === "auth/operation-not-allowed") {
      throw new Error("Email/Password registration is not enabled in Firebase Console. Please enable Email/Password in Authentication -> Sign-in method.");
    }
    throw new Error(err.message || "Failed to create account.");
  }
}

export async function fbSignOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn("Firebase signOut notice:", err);
  }
}

// =========================================================================
// 2. Branches
// =========================================================================

export async function fbGetBranches(): Promise<{ branches: Branch[] }> {
  await ensureFirebaseSeeded();
  try {
    const snap = await getDocs(collection(db, "branches"));
    const branches: Branch[] = snap.docs.map((d: any) => d.data() as Branch);
    if (branches.length === 0) branches.push(DEFAULT_BRANCH);
    return { branches };
  } catch {
    return { branches: [DEFAULT_BRANCH] };
  }
}

export async function fbCreateBranch(input: Omit<Branch, "id" | "createdAt" | "updatedAt">): Promise<{ branch: Branch }> {
  const branch: Branch = {
    ...input,
    id: generateId("branch"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, "branches", branch.id), branch);
  return { branch };
}

export async function fbUpdateBranch(id: string, input: Partial<Omit<Branch, "id" | "createdAt" | "updatedAt">>): Promise<{ branch: Branch }> {
  const ref = doc(db, "branches", id);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? snap.data() : DEFAULT_BRANCH;
  const updated: Branch = {
    ...(existing as Branch),
    ...input,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(ref, updated, { merge: true });
  return { branch: updated };
}

// =========================================================================
// 3. Users / Cashiers
// =========================================================================

export async function fbGetUsers(): Promise<{ users: User[] }> {
  await ensureFirebaseSeeded();
  try {
    const snap = await getDocs(collection(db, "users"));
    const users: User[] = snap.docs.map((d: any) => {
      const data = d.data();
      return {
        id: data.id || d.id,
        name: data.name,
        mobile: data.mobile || "",
        username: data.username,
        role: data.role || "CASHIER",
        status: data.status || "ACTIVE",
        branchId: data.branchId || null,
        lastLoginAt: data.lastLoginAt || null,
        createdAt: data.createdAt || new Date().toISOString(),
      };
    });
    return { users };
  } catch {
    return {
      users: [
        {
          id: "user-admin",
          name: "Admin User",
          mobile: "9876543210",
          username: "admin",
          role: "ADMIN",
          status: "ACTIVE",
          branchId: DEFAULT_BRANCH_ID,
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }
}

export async function fbCreateCashier(input: {
  name: string;
  mobile: string;
  username: string;
  password?: string;
  branchId: string;
}): Promise<{ user: User }> {
  const user: User = {
    id: generateId("user"),
    name: input.name,
    mobile: input.mobile,
    username: input.username,
    role: "CASHIER",
    status: "ACTIVE",
    branchId: input.branchId,
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, "users", user.id), {
    ...user,
    password: input.password || "Cashier1234",
  });

  return { user };
}

export async function fbUpdateUser(id: string, input: Partial<User> & { password?: string }): Promise<{ user: User }> {
  const ref = doc(db, "users", id);
  const snap = await getDoc(ref);
  const current = snap.exists() ? snap.data() : {};
  const updated = { ...current, ...input, updatedAt: new Date().toISOString() };
  await setDoc(ref, updated, { merge: true });
  return { user: updated as User };
}

// =========================================================================
// 4. Services, Categories, Products, Rates & AddOns
// =========================================================================

export async function fbGetServices(): Promise<{ services: Service[] }> {
  await ensureFirebaseSeeded();
  try {
    const snap = await getDocs(collection(db, "services"));
    const services = snap.docs.map((d: any) => d.data() as Service);
    return { services: services.length > 0 ? services : DEFAULT_SERVICES };
  } catch {
    return { services: DEFAULT_SERVICES };
  }
}

export async function fbCreateService(input: Omit<Service, "id" | "createdAt" | "updatedAt">): Promise<{ service: Service }> {
  const service: Service = {
    ...input,
    id: generateId("srv"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, "services", service.id), service);
  return { service };
}

export async function fbUpdateService(id: string, input: Partial<Service>): Promise<{ service: Service }> {
  const ref = doc(db, "services", id);
  const snap = await getDoc(ref);
  const updated = { ...(snap.data() as Service), ...input, updatedAt: new Date().toISOString() };
  await setDoc(ref, updated, { merge: true });
  return { service: updated };
}

export async function fbDeleteService(id: string): Promise<void> {
  await deleteDoc(doc(db, "services", id));
}

export async function fbGetCategories(): Promise<{ categories: ItemCategory[] }> {
  await ensureFirebaseSeeded();
  try {
    const snap = await getDocs(collection(db, "categories"));
    const categories = snap.docs.map((d: any) => d.data() as ItemCategory);
    return { categories: categories.length > 0 ? categories : DEFAULT_CATEGORIES };
  } catch {
    return { categories: DEFAULT_CATEGORIES };
  }
}

export async function fbCreateCategory(input: { name: string }): Promise<{ category: ItemCategory }> {
  const category: ItemCategory = {
    id: generateId("cat"),
    name: input.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, "categories", category.id), category);
  return { category };
}

export async function fbUpdateCategory(id: string, input: { name: string }): Promise<{ category: ItemCategory }> {
  const ref = doc(db, "categories", id);
  const snap = await getDoc(ref);
  const updated = { ...(snap.data() as ItemCategory), ...input, updatedAt: new Date().toISOString() };
  await setDoc(ref, updated, { merge: true });
  return { category: updated };
}

export async function fbDeleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, "categories", id));
}

export async function fbGetProducts(): Promise<{ products: Product[] }> {
  await ensureFirebaseSeeded();
  try {
    const snap = await getDocs(collection(db, "products"));
    const products = snap.docs.map((d: any) => d.data() as Product);
    return { products: products.length > 0 ? products : DEFAULT_PRODUCTS };
  } catch {
    return { products: DEFAULT_PRODUCTS };
  }
}

export async function fbCreateProduct(input: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<{ product: Product }> {
  const product: Product = {
    ...input,
    id: generateId("prod"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, "products", product.id), product);
  return { product };
}

export async function fbUpdateProduct(id: string, input: Partial<Product>): Promise<{ product: Product }> {
  const ref = doc(db, "products", id);
  const snap = await getDoc(ref);
  const updated = { ...(snap.data() as Product), ...input, updatedAt: new Date().toISOString() };
  await setDoc(ref, updated, { merge: true });
  return { product: updated };
}

export async function fbDeleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, "products", id));
}

export async function fbGetRates(): Promise<{ rates: ServiceRate[] }> {
  await ensureFirebaseSeeded();
  try {
    const snap = await getDocs(collection(db, "rates"));
    const rates = snap.docs.map((d: any) => d.data() as ServiceRate);
    return { rates: rates.length > 0 ? rates : DEFAULT_RATES };
  } catch {
    return { rates: DEFAULT_RATES };
  }
}

export async function fbCreateRate(input: any): Promise<{ rate: ServiceRate }> {
  const rate: ServiceRate = {
    ...input,
    id: generateId("rate"),
    status: input.status || "ACTIVE",
    gstRate: input.gstRate ?? 18,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, "rates", rate.id), rate);
  return { rate };
}

export async function fbUpdateRate(id: string, input: any): Promise<{ rate: ServiceRate }> {
  const ref = doc(db, "rates", id);
  const snap = await getDoc(ref);
  const updated = { ...(snap.data() as ServiceRate), ...input, updatedAt: new Date().toISOString() };
  await setDoc(ref, updated, { merge: true });
  return { rate: updated };
}

export async function fbDeleteRate(id: string): Promise<void> {
  await deleteDoc(doc(db, "rates", id));
}

export async function fbGetAddOns(): Promise<{ addons: AddOn[] }> {
  await ensureFirebaseSeeded();
  try {
    const snap = await getDocs(collection(db, "addons"));
    const addons = snap.docs.map((d: any) => d.data() as AddOn);
    return { addons: addons.length > 0 ? addons : DEFAULT_ADDONS };
  } catch {
    return { addons: DEFAULT_ADDONS };
  }
}

export async function fbCreateAddOn(input: Omit<AddOn, "id" | "createdAt" | "updatedAt">): Promise<{ addon: AddOn }> {
  const addon: AddOn = {
    ...input,
    id: generateId("addon"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, "addons", addon.id), addon);
  return { addon };
}

export async function fbUpdateAddOn(id: string, input: Partial<AddOn>): Promise<{ addon: AddOn }> {
  const ref = doc(db, "addons", id);
  const snap = await getDoc(ref);
  const updated = { ...(snap.data() as AddOn), ...input, updatedAt: new Date().toISOString() };
  await setDoc(ref, updated, { merge: true });
  return { addon: updated };
}

export async function fbDeleteAddOn(id: string): Promise<void> {
  await deleteDoc(doc(db, "addons", id));
}

// =========================================================================
// 5. Settings
// =========================================================================

export async function fbGetSettings(): Promise<{ settings: GlobalSettings }> {
  await ensureFirebaseSeeded();
  try {
    const snap = await getDoc(doc(db, "settings", "global-settings"));
    if (snap.exists()) {
      return { settings: snap.data() as GlobalSettings };
    }
  } catch {}
  return { settings: DEFAULT_SETTINGS };
}

export async function fbUpdateSettings(input: Partial<GlobalSettings>): Promise<{ settings: GlobalSettings }> {
  const ref = doc(db, "settings", "global-settings");
  const snap = await getDoc(ref);
  const existing = snap.exists() ? snap.data() : DEFAULT_SETTINGS;
  const updated = { ...existing, ...input, updatedAt: new Date().toISOString() } as GlobalSettings;
  await setDoc(ref, updated, { merge: true });
  return { settings: updated };
}

// =========================================================================
// 6. Customers
// =========================================================================

export async function fbGetCustomers(params: { search?: string; branchId?: string; page?: number; limit?: number } = {}): Promise<{
  customers: Customer[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  await ensureFirebaseSeeded();
  try {
    const snap = await getDocs(collection(db, "customers"));
    let customers = snap.docs.map((d: any) => d.data() as Customer);

    if (params.branchId) {
      customers = customers.filter((c: Customer) => c.branchId === params.branchId);
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      customers = customers.filter(
        (c: Customer) => c.name.toLowerCase().includes(q) || c.mobile.includes(q) || (c.address && c.address.toLowerCase().includes(q))
      );
    }

    const total = customers.length;
    const page = params.page || 1;
    const limit = params.limit || 50;
    const startIndex = (page - 1) * limit;
    const paginated = customers.slice(startIndex, startIndex + limit);

    return {
      customers: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  } catch {
    return {
      customers: [],
      pagination: { page: 1, limit: 50, total: 0, totalPages: 1 },
    };
  }
}

export async function fbSearchCustomers(queryText: string, branchId?: string): Promise<{ customers: Customer[] }> {
  const result = await fbGetCustomers({ search: queryText, branchId, limit: 10 });
  return { customers: result.customers };
}

export async function fbCreateCustomer(input: Omit<Customer, "id" | "createdAt" | "updatedAt" | "branch">): Promise<{ customer: Customer }> {
  // Check duplicate mobile in branch
  const q = query(
    collection(db, "customers"),
    where("mobile", "==", input.mobile),
    where("branchId", "==", input.branchId)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    const existing = snap.docs[0].data() as Customer;
    return { customer: existing };
  }

  const customer: Customer = {
    ...input,
    id: generateId("cust"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, "customers", customer.id), customer);
  return { customer };
}

export async function fbUpdateCustomer(id: string, input: Partial<Customer>): Promise<{ customer: Customer }> {
  const ref = doc(db, "customers", id);
  const snap = await getDoc(ref);
  const updated = { ...(snap.data() as Customer), ...input, updatedAt: new Date().toISOString() };
  await setDoc(ref, updated, { merge: true });
  return { customer: updated };
}

export async function fbDeleteCustomer(id: string): Promise<void> {
  await deleteDoc(doc(db, "customers", id));
}

export async function fbGetCustomerProfile(id: string): Promise<CustomerProfile> {
  const cSnap = await getDoc(doc(db, "customers", id));
  const customer = cSnap.exists()
    ? (cSnap.data() as Customer)
    : {
        id,
        branchId: DEFAULT_BRANCH_ID,
        name: "Unknown Customer",
        mobile: "N/A",
        address: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

  // Find orders for this customer
  const ordersSnap = await getDocs(collection(db, "orders"));
  const allOrders = ordersSnap.docs.map((d: any) => d.data() as Order).filter((o: Order) => o.customerId === id);

  const totalOrders = allOrders.length;
  const totalAmountSpent = allOrders.reduce((sum: number, o: Order) => sum + (o.grandTotal || 0), 0);
  const outstandingBalance = allOrders.reduce((sum: number, o: Order) => sum + (o.balanceAmount || 0), 0);
  const lastVisit = allOrders.length > 0 ? allOrders[0].orderDate : null;

  return {
    customer,
    stats: {
      totalOrders,
      totalAmountSpent,
      outstandingBalance,
      lastVisit,
    },
    orders: allOrders.map((o: Order) => ({
      id: o.id,
      billNumber: o.billNumber,
      grandTotal: o.grandTotal,
      paidAmount: o.paidAmount,
      balanceAmount: o.balanceAmount,
      orderDate: o.orderDate,
      status: o.status,
    })),
  };
}

// =========================================================================
// 7. Orders & Live Sequencing
// =========================================================================

export async function fbGetOrderNumberPreview(branchId = DEFAULT_BRANCH_ID): Promise<{
  billNumber: string;
  tokenNumber: string;
  sequenceDate: string;
}> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); // e.g. 20261014

  let branchCode = "BW01";
  try {
    const bSnap = await getDoc(doc(db, "branches", branchId));
    if (bSnap.exists()) branchCode = bSnap.data().code || "BW01";
  } catch {}

  // Fetch count of orders created today
  let countToday = 1;
  try {
    const ordersSnap = await getDocs(collection(db, "orders"));
    const todayOrders = ordersSnap.docs.filter((d: any) => {
      const data = d.data();
      return (data.branchId === branchId || !data.branchId) && data.orderDate?.startsWith(today.toISOString().slice(0, 10));
    });
    countToday = todayOrders.length + 1;
  } catch {}

  const seqStr = String(countToday).padStart(3, "0");
  return {
    billNumber: `${branchCode}-${dateStr}-${seqStr}`,
    tokenNumber: `T-${seqStr}`,
    sequenceDate: today.toISOString().slice(0, 10),
  };
}

export async function fbCreateOrder(input: CreateOrderInput): Promise<{ order: Order }> {
  await ensureFirebaseSeeded();

  const preview = await fbGetOrderNumberPreview(input.branchId);
  const orderId = generateId("ord");

  // Fetch customer details
  let customerInfo = { name: "Valued Customer", mobile: "" };
  try {
    const cSnap = await getDoc(doc(db, "customers", input.customerId));
    if (cSnap.exists()) {
      customerInfo = { name: cSnap.data().name, mobile: cSnap.data().mobile };
    }
  } catch {}

  // Fetch branch details
  let branchInfo = { name: DEFAULT_BRANCH.name, code: DEFAULT_BRANCH.code, address: DEFAULT_BRANCH.address, mobile: DEFAULT_BRANCH.mobile };
  try {
    const bSnap = await getDoc(doc(db, "branches", input.branchId));
    if (bSnap.exists()) {
      branchInfo = bSnap.data() as any;
    }
  } catch {}

  const orderDate = input.orderDate || new Date().toISOString();
  const expectedDeliveryDate = input.expectedDeliveryDate || new Date(Date.now() + 86400000 * 2).toISOString();

  // Compute financial totals
  let subtotal = 0;
  const items = (input.items || []).map((item: any, idx: number) => {
    const amount = Number(item.amount) || Number(item.rate) * (Number(item.quantity) || Number(item.weightKg) || 1);
    subtotal += amount;
    return {
      id: `${orderId}_item_${idx + 1}`,
      serviceNameSnapshot: item.serviceName || "Laundry Service",
      productNameSnapshot: item.productName || null,
      categorySnapshot: item.category || null,
      unitSnapshot: item.unit || "piece",
      pricingType: (item.weightKg && item.weightKg > 0 ? "PER_KG" : "PER_PIECE") as "PER_PIECE" | "PER_KG",
      quantity: item.quantity ?? null,
      weightKg: item.weightKg ?? null,
      rate: Number(item.rate) || 0,
      gstRate: Number(item.gstRate) || 18,
      amount,
      addOns: item.addOns || [],
    };
  });

  const discountAmount = Number(input.discountAmount) || 0;
  const gstRate = Number(input.gstRate) || 18;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const gstAmount = Number(((taxableAmount * gstRate) / 100).toFixed(2));
  const rawTotal = taxableAmount + gstAmount;
  const grandTotal = Math.round(rawTotal);
  const roundOff = Number((grandTotal - rawTotal).toFixed(2));

  let paidAmount = 0;
  const payments: any[] = [];
  if (input.initialPayment && input.initialPayment.amount > 0) {
    paidAmount = Number(input.initialPayment.amount);
    payments.push({
      id: generateId("pay"),
      method: input.initialPayment.method || "CASH",
      amount: paidAmount,
      referenceNumber: input.initialPayment.referenceNumber || null,
      paidAt: new Date().toISOString(),
      receivedBy: { name: "Store Cashier" },
    });
  }

  const balanceAmount = Math.max(0, grandTotal - paidAmount);
  const paymentStatus: "PAID" | "PARTIAL" | "UNPAID" =
    paidAmount >= grandTotal ? "PAID" : paidAmount > 0 ? "PARTIAL" : "UNPAID";

  const order: Order & { items: any[]; payments: any[]; printLogs: any[] } = {
    id: orderId,
    branchId: input.branchId,
    customerId: input.customerId,
    createdById: "user-admin",
    billNumber: preview.billNumber,
    tokenNumber: preview.tokenNumber,
    status: (input.status as any) || "RECEIVED",
    orderDate,
    expectedDeliveryDate,
    deliveredDate: null,
    subtotal,
    discountAmount,
    gstRate,
    gstAmount,
    grandTotal,
    paidAmount,
    balanceAmount,
    paymentStatus,
    notes: input.notes || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customer: customerInfo,
    branch: branchInfo,
    items,
    payments,
    printLogs: [
      {
        id: generateId("prt"),
        printType: "ORIGINAL",
        printCount: 1,
        printedAt: new Date().toISOString(),
        user: { name: "System Counter" },
      },
    ],
  };

  await setDoc(doc(db, "orders", order.id), order);
  return { order };
}

export async function fbGetOrders(params: {
  search?: string;
  branchId?: string;
  status?: string;
  paymentStatus?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{
  orders: Order[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  await ensureFirebaseSeeded();
  try {
    const snap = await getDocs(collection(db, "orders"));
    let orders = snap.docs.map((d: any) => d.data() as Order);

    // Sort newest first
    orders.sort((a: Order, b: Order) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

    if (params.branchId) {
      orders = orders.filter((o: Order) => o.branchId === params.branchId);
    }
    if (params.status) {
      orders = orders.filter((o: Order) => o.status === params.status);
    }
    if (params.paymentStatus) {
      orders = orders.filter((o: Order) => o.paymentStatus === params.paymentStatus);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      orders = orders.filter(
        (o: Order) =>
          o.billNumber.toLowerCase().includes(q) ||
          o.tokenNumber.toLowerCase().includes(q) ||
          (o.customer?.name && o.customer.name.toLowerCase().includes(q)) ||
          (o.customer?.mobile && o.customer.mobile.includes(q))
      );
    }

    const total = orders.length;
    const page = params.page || 1;
    const limit = params.limit || 50;
    const startIndex = (page - 1) * limit;
    const paginated = orders.slice(startIndex, startIndex + limit);

    return {
      orders: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  } catch {
    return {
      orders: [],
      pagination: { page: 1, limit: 50, total: 0, totalPages: 1 },
    };
  }
}

export async function fbGetOrder(id: string): Promise<{ order: any }> {
  const snap = await getDoc(doc(db, "orders", id));
  if (snap.exists()) {
    return { order: snap.data() };
  }
  throw new Error("Order not found");
}

export async function fbUpdateOrderStatus(id: string, status: string): Promise<{ order: Order }> {
  const ref = doc(db, "orders", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Order not found");

  const existing = snap.data() as Order;
  const isDelivered = status === "DELIVERED";
  const updated: Order = {
    ...existing,
    status: status as any,
    deliveredDate: isDelivered ? new Date().toISOString() : existing.deliveredDate,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(ref, updated, { merge: true });
  return { order: updated };
}

export async function fbAddOrderPayment(
  id: string,
  payload: { amount: number; method: string; referenceNumber?: string; status?: string }
): Promise<{ order: Order }> {
  const ref = doc(db, "orders", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Order not found");

  const orderData = snap.data();
  const addedAmount = Number(payload.amount) || 0;
  const newPaidAmount = (Number(orderData.paidAmount) || 0) + addedAmount;
  const newBalanceAmount = Math.max(0, (Number(orderData.grandTotal) || 0) - newPaidAmount);
  const newPaymentStatus = newPaidAmount >= orderData.grandTotal ? "PAID" : newPaidAmount > 0 ? "PARTIAL" : "UNPAID";

  const payments = orderData.payments || [];
  payments.push({
    id: generateId("pay"),
    method: payload.method,
    amount: addedAmount,
    referenceNumber: payload.referenceNumber || null,
    paidAt: new Date().toISOString(),
    receivedBy: { name: "Store Cashier" },
  });

  const updated = {
    ...orderData,
    paidAmount: newPaidAmount,
    balanceAmount: newBalanceAmount,
    paymentStatus: newPaymentStatus,
    payments,
    updatedAt: new Date().toISOString(),
  } as Order;

  await setDoc(ref, updated, { merge: true });
  return { order: updated };
}

export async function fbRecordOrderPrint(id: string): Promise<any> {
  const ref = doc(db, "orders", id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    const printLogs = data.printLogs || [];
    printLogs.push({
      id: generateId("prt"),
      printType: "ORIGINAL",
      printCount: printLogs.length + 1,
      printedAt: new Date().toISOString(),
      user: { name: "Counter Staff" },
    });
    await updateDoc(ref, { printLogs });
  }
  return { success: true };
}

export async function fbRecordOrderReprint(id: string): Promise<any> {
  const ref = doc(db, "orders", id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    const printLogs = data.printLogs || [];
    printLogs.push({
      id: generateId("prt"),
      printType: "REPRINT",
      printCount: printLogs.length + 1,
      printedAt: new Date().toISOString(),
      user: { name: "Counter Staff" },
    });
    await updateDoc(ref, { printLogs });
  }
  return { success: true };
}

// =========================================================================
// 8. Real-Time Reports & KPIs
// =========================================================================

export async function fbGetReports(branchId?: string, startDate?: string, endDate?: string): Promise<any> {
  await ensureFirebaseSeeded();
  const snap = await getDocs(collection(db, "orders"));
  let orders = snap.docs.map((d: any) => d.data() as Order);

  if (branchId) {
    orders = orders.filter((o: Order) => o.branchId === branchId);
  }
  if (startDate) {
    orders = orders.filter((o: Order) => o.orderDate >= startDate);
  }
  if (endDate) {
    orders = orders.filter((o: Order) => o.orderDate <= `${endDate}T23:59:59.999Z`);
  }

  const totalRevenue = orders.reduce((sum: number, o: Order) => sum + (o.paidAmount || 0), 0);
  const totalSales = orders.reduce((sum: number, o: Order) => sum + (o.grandTotal || 0), 0);
  const totalBalanceDue = orders.reduce((sum: number, o: Order) => sum + (o.balanceAmount || 0), 0);
  const orderCount = orders.length;

  const paymentBreakdown: Record<string, number> = { CASH: 0, UPI: 0, CARD: 0, CREDIT: 0 };
  const statusCounts: Record<string, number> = {
    RECEIVED: 0,
    WASHING: 0,
    DRYING: 0,
    IRONING: 0,
    READY: 0,
    DELIVERED: 0,
  };

  for (const o of orders) {
    if (statusCounts[o.status] !== undefined) {
      statusCounts[o.status]++;
    }
    const orderPayments = (o as any).payments || [];
    for (const p of orderPayments) {
      const m = p.method || "CASH";
      paymentBreakdown[m] = (paymentBreakdown[m] || 0) + (Number(p.amount) || 0);
    }
  }

  return {
    kpis: {
      totalRevenue,
      totalSales,
      totalBalanceDue,
      orderCount,
      readyOrdersCount: statusCounts.READY,
      processingOrdersCount: statusCounts.RECEIVED + statusCounts.WASHING + statusCounts.DRYING + statusCounts.IRONING,
    },
    paymentBreakdown,
    statusCounts,
    recentOrders: orders.slice(0, 10),
  };
}

export async function fbClearTransactionData(confirmText: string): Promise<any> {
  if (confirmText !== "DELETE_ALL_TRANSACTIONS") {
    throw new Error("Confirmation phrase mismatch. Action cancelled.");
  }

  const snap = await getDocs(collection(db, "orders"));
  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }
  return { success: true, message: `Cleared ${snap.size} orders.` };
}

export async function fbGetPublicOrderStatus(billNumber: string, mobile: string): Promise<any> {
  const snap = await getDocs(collection(db, "orders"));
  const found = snap.docs
    .map((d: any) => d.data() as Order)
    .find((o: Order) => o.billNumber.trim().toUpperCase() === billNumber.trim().toUpperCase() && o.customer?.mobile === mobile);

  if (!found) {
    throw new Error("No active laundry order found with matching Bill Number and Mobile Number.");
  }

  return { order: found };
}
