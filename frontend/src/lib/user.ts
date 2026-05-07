import { createUser } from "./api";

const USER_STORAGE_KEY = "userId";

let pendingUserPromise: Promise<string> | null = null;

export function getStoredUserId() {
  return localStorage.getItem(USER_STORAGE_KEY);
}

export function setStoredUserId(userId: string) {
  localStorage.setItem(USER_STORAGE_KEY, userId);
}

export async function ensureUserId() {
  const existingUserId = getStoredUserId();
  if (existingUserId) {
    return existingUserId;
  }

  if (!pendingUserPromise) {
    pendingUserPromise = createUser()
      .then((user) => {
        setStoredUserId(user.id);
        return user.id;
      })
      .finally(() => {
        pendingUserPromise = null;
      });
  }

  return pendingUserPromise;
}
