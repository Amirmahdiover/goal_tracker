import axios from "axios";
import type {
  Concern,
  Goal,
  GoalSummary,
  Step,
  StepPayload,
  TrackingPayload,
  TrackingRecord,
  TrackingUpdatePayload,
  User,
} from "../types";

const USER_STORAGE_KEY = "userId";

export const SOFT_ERROR_MESSAGE =
  "مشکلی پیش آمد. دوباره امتحان کنیم؟";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

api.interceptors.request.use((config) => {
  if (config.url !== "/create-user") {
    const userId = localStorage.getItem(USER_STORAGE_KEY);
    if (userId) {
      config.headers.set("X-User-ID", userId);
    }
  }

  return config;
});

export function isNotFoundError(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

export async function createUser() {
  const response = await api.post<User>("/create-user");
  return response.data;
}

export async function getConcerns() {
  const response = await api.get<Concern[]>("/concerns/");
  return response.data;
}

export async function createConcern(text: string) {
  const response = await api.post<Concern>("/concerns/", { text });
  return response.data;
}

export async function updateConcern(concernId: number, text: string) {
  const response = await api.put<Concern>(`/concerns/${concernId}`, { text });
  return response.data;
}

export async function deleteConcern(concernId: number) {
  await api.delete(`/concerns/${concernId}`);
}

export async function getGoal() {
  const response = await api.get<Goal>("/goal/");
  return response.data;
}

export async function createGoal(title: string) {
  const response = await api.post<Goal>("/goal/", { title });
  return response.data;
}

export async function updateGoal(title: string) {
  const response = await api.put<Goal>("/goal/", { title });
  return response.data;
}

export async function deleteGoal() {
  await api.delete("/goal/");
}

export async function getGoalSummary() {
  const response = await api.get<GoalSummary>("/goal/summary");
  return response.data;
}

export async function getSteps() {
  const response = await api.get<Step[]>("/goal/steps");
  return response.data;
}

export async function createSteps(steps: StepPayload[]) {
  const response = await api.post<Step[]>("/goal/steps", { steps });
  return response.data;
}

export async function addStep(step: StepPayload) {
  const response = await api.post<Step>("/goal/steps/add", step);
  return response.data;
}

export async function updateStep(stepId: number, step: StepPayload) {
  const response = await api.put<Step>(`/steps/${stepId}`, step);
  return response.data;
}

export async function deleteStep(stepId: number) {
  await api.delete(`/steps/${stepId}`);
}

export async function getTrackingHistory() {
  const response = await api.get<TrackingRecord[]>("/tracking/");
  return response.data;
}

export async function createTracking(payload: TrackingPayload) {
  const response = await api.post("/tracking/", payload);
  return response.data;
}

export async function updateTracking(
  trackingId: number,
  payload: TrackingUpdatePayload,
) {
  const response = await api.put(`/tracking/${trackingId}`, payload);
  return response.data;
}

export async function deleteTracking(trackingId: number) {
  await api.delete(`/tracking/${trackingId}`);
}
