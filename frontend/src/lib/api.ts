const API_BASE_URL = "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getUserId() {
  return localStorage.getItem("user_id");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const userId = getUserId();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (userId) {
    headers["X-User-ID"] = userId;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new ApiError(error?.detail || "Something went wrong", response.status);
  }

  return response.json();
}

export type GoalType = "hours" | "count";

export type Goal = {
  id: string;
  title: string;
  goal_type: GoalType;
  target_value: number;
  created_at: string;
};

export type GoalSummary = {
  goal_id: string;
  title: string;
  goal_type: GoalType;
  target_value: number;
  total_progress: number;
  remaining: number;
  progress_percent: number;
  daily_average: number;
  estimated_days_left: number | null;
  has_milestones: boolean;
};

export type Milestone = {
  id: number;
  goal_id: string;
  title: string;
  target_value: number;
  order_index: number;
  current_progress: number;
  remaining: number;
  progress_percent: number;
  bar_width_percent: number;
  created_at: string;
};

export type CreatedMilestone = {
  id: number;
  goal_id: string;
  title: string;
  target_value: number;
  order_index: number;
  created_at: string;
};

export type Tracking = {
  id: number;
  goal_id: string;
  milestone_id: number | null;
  amount: number;
  date: string;
  created_at: string;
};

export async function createUser() {
  const user = await request<{ id: string }>("/create-user", {
    method: "POST",
  });

  localStorage.setItem("user_id", user.id);
  return user;
}

export async function createGoal(data: {
  title: string;
  goal_type: GoalType;
  target_value: number;
}) {
  return request<Goal>("/goal/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getGoal() {
  return request<Goal>("/goal/");
}

export async function getGoalSummary() {
  return request<GoalSummary>("/goal/summary");
}

export async function createMilestones(data: {
  milestones: {
    title: string;
    target_value: number;
    order_index: number;
  }[];
}) {
  return request<CreatedMilestone[]>("/goal/milestones", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMilestones() {
  return request<Milestone[]>("/goal/milestones");
}

export async function addTracking(data: {
  amount: number;
  date: string;
  milestone_id?: number;
}) {
  return request<Tracking>("/tracking/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getTrackingHistory() {
  return request<Tracking[]>("/tracking/");
}
