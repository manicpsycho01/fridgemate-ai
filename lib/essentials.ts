import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeItemName } from "./inventory";

function keyForUser(userId: string): string {
  return `fridgemate:essentials:${userId}`;
}

const memoryFallback = new Map<string, string>();

function getWebLocalStorage(): Storage | null {
  try {
    if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
      return globalThis.localStorage;
    }
  } catch {
    // ignore
  }
  return null;
}

async function safeGet(key: string): Promise<string | null> {
  const web = getWebLocalStorage();
  if (web) {
    return web.getItem(key);
  }

  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return memoryFallback.get(key) ?? null;
  }
}

async function safeSet(key: string, value: string): Promise<void> {
  const web = getWebLocalStorage();
  if (web) {
    web.setItem(key, value);
    return;
  }

  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    memoryFallback.set(key, value);
  }
}

export async function getUserEssentials(userId: string): Promise<string[]> {
  const raw = await safeGet(keyForUser(userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export async function setUserEssentials(userId: string, essentials: string[]): Promise<void> {
  const unique = Array.from(new Set(essentials.map((s) => s.trim()).filter(Boolean)));
  await safeSet(keyForUser(userId), JSON.stringify(unique));
}

export function essentialsSelectedMap(essentials: string[]): Set<string> {
  return new Set(essentials.map((e) => normalizeItemName(e)));
}
