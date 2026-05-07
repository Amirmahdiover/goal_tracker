const ONBOARDING_STORAGE_KEY = "hasSeenOnboarding";

export function hasSeenOnboarding() {
  return localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true";
}

export function markOnboardingSeen() {
  localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
}
