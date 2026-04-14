import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, appUsers, InsertAppUser, AppUser, subscriptions, InsertSubscription, Subscription } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================
// Funções de Autenticação Customizada (Email/Senha)
// ============================================

export async function createAppUser(user: InsertAppUser): Promise<AppUser | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create app user: database not available");
    return null;
  }

  try {
    await db.insert(appUsers).values(user);
    const result = await db.select().from(appUsers).where(eq(appUsers.email, user.email)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create app user:", error);
    throw error;
  }
}

export async function getAppUserByEmail(email: string): Promise<AppUser | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get app user: database not available");
    return null;
  }

  const result = await db.select().from(appUsers).where(eq(appUsers.email, email)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAppUserById(id: number): Promise<AppUser | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get app user: database not available");
    return null;
  }

  const result = await db.select().from(appUsers).where(eq(appUsers.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateAppUser(id: number, data: Partial<InsertAppUser>): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update app user: database not available");
    return;
  }

  await db.update(appUsers).set(data).where(eq(appUsers.id, id));
}

export async function updateLastSignIn(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(appUsers).set({ lastSignedIn: new Date() }).where(eq(appUsers.id, id));
}

// ============================================
// Funções de Assinatura Premium
// ============================================

export async function createSubscription(subscription: InsertSubscription): Promise<Subscription | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create subscription: database not available");
    return null;
  }

  try {
    await db.insert(subscriptions).values(subscription);
    const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, subscription.userId)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create subscription:", error);
    throw error;
  }
}

export async function getActiveSubscription(userId: number): Promise<Subscription | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get subscription: database not available");
    return null;
  }

  const result = await db.select().from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  
  if (result.length === 0) return null;
  
  const sub = result[0];
  // Verificar se ainda está ativa
  if (sub.status === 'active' && new Date(sub.expiresAt) > new Date()) {
    return sub;
  }
  
  return null;
}

export async function activatePremium(userId: number, type: 'monthly' | 'yearly'): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const now = new Date();
  const expiresAt = new Date(now);
  
  if (type === 'monthly') {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  } else {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  }

  // Atualizar usuário
  await db.update(appUsers).set({
    isPremium: 1,
    premiumType: type,
    premiumExpiresAt: expiresAt,
  }).where(eq(appUsers.id, userId));

  // Criar registro de assinatura
  await db.insert(subscriptions).values({
    userId,
    type,
    priceInCents: type === 'monthly' ? 999 : 11000,
    status: 'active',
    expiresAt,
  });
}
