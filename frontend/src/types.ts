export type User = {
  id: string;
  created_at: string;
  last_active_at: string | null;
};

export type Concern = {
  id: number;
  text: string;
  created_at: string;
};

export type Goal = {
  id: string;
  title: string;
  created_at: string;
};

export type GoalSummary = {
  goal_id: string;
  title: string;
  progress_percent: number;
  has_steps: boolean;
  steps_count: number;
};

export type Step = {
  id: number;
  goal_id: string;
  title: string;
  target_value: number;
  unit: string;
  order_index: number;
  current_progress: number;
  remaining: number;
  progress_percent: number;
  created_at: string;
};

export type StepPayload = {
  title: string;
  target_value: number;
  unit: string;
  order_index: number;
};

export type TrackingRecord = {
  id: number;
  goal_id: string;
  step_id: number;
  step_title: string;
  unit: string;
  amount: number;
  date: string;
  note: string | null;
  created_at: string;
};

export type TrackingPayload = {
  step_id: number;
  amount: number;
  date: string;
  note: string | null;
};

export type TrackingUpdatePayload = {
  amount: number;
  date: string;
  note: string | null;
};
