import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ApiError,
  addTracking,
  createGoal,
  createMilestones,
  createUser,
  getGoal,
  getGoalSummary,
  getMilestones,
  getTrackingHistory,
  type Goal,
  type GoalSummary,
  type GoalType,
  type Milestone,
  type Tracking,
} from "./lib/api";
import "./App.css";

type View = "setup" | "create-goal" | "milestones" | "dashboard" | "add-progress" | "history";

type GoalForm = {
  title: string;
  goalType: GoalType;
  targetValue: string;
  wantsMilestones: boolean;
};

type MilestoneRow = {
  key: number;
  title: string;
  targetValue: string;
};

type DashboardData = {
  summary: GoalSummary;
  milestones: Milestone[];
  history: Tracking[];
};

const emptyGoalForm: GoalForm = {
  title: "",
  goalType: "hours",
  targetValue: "",
  wantsMilestones: false,
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function getTodayInputValue() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(value);
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(value, 100));
}

function createEmptyMilestoneRow(key: number): MilestoneRow {
  return { key, title: "", targetValue: "" };
}

async function fetchDashboardData(): Promise<DashboardData> {
  const nextSummary = await getGoalSummary();
  const [nextMilestones, nextHistory] = await Promise.all([
    nextSummary.has_milestones ? getMilestones() : Promise.resolve([]),
    getTrackingHistory(),
  ]);

  return {
    summary: nextSummary,
    milestones: nextMilestones,
    history: nextHistory,
  };
}

function App() {
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem("user_id"));
  const [view, setView] = useState<View>(userId ? "dashboard" : "setup");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [summary, setSummary] = useState<GoalSummary | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [history, setHistory] = useState<Tracking[]>([]);
  const [goalForm, setGoalForm] = useState<GoalForm>(emptyGoalForm);
  const [milestoneRows, setMilestoneRows] = useState<MilestoneRow[]>([createEmptyMilestoneRow(1)]);
  const [trackingAmount, setTrackingAmount] = useState("");
  const [trackingDate, setTrackingDate] = useState(() => getTodayInputValue());
  const [selectedMilestoneId, setSelectedMilestoneId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function applyDashboardData(data: DashboardData) {
    setSummary(data.summary);
    setMilestones(data.milestones);
    setHistory(data.history);
  }

  async function refreshDashboard() {
    setLoading(true);
    setError("");

    try {
      const dashboardData = await fetchDashboardData();
      applyDashboardData(dashboardData);
      setView("dashboard");
    } catch (refreshError) {
      setError(getErrorMessage(refreshError));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser() {
    setSubmitting(true);
    setError("");

    try {
      const user = await createUser();
      setUserId(user.id);
      setView("create-goal");
    } catch (createUserError) {
      setError(getErrorMessage(createUserError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const targetValue = Number(goalForm.targetValue);

    if (!goalForm.title.trim()) {
      setError("Goal title is required.");
      setSubmitting(false);
      return;
    }

    if (!Number.isFinite(targetValue) || targetValue <= 0) {
      setError("Target value must be greater than 0.");
      setSubmitting(false);
      return;
    }

    try {
      const createdGoal = await createGoal({
        title: goalForm.title.trim(),
        goal_type: goalForm.goalType,
        target_value: targetValue,
      });

      setGoal(createdGoal);
      setGoalForm(emptyGoalForm);

      if (goalForm.wantsMilestones) {
        setMilestoneRows([createEmptyMilestoneRow(1)]);
        setView("milestones");
      } else {
        await refreshDashboard();
      }
    } catch (createGoalError) {
      setError(getErrorMessage(createGoalError));
    } finally {
      setSubmitting(false);
    }
  }

  const milestoneTotal = useMemo(
    () => milestoneRows.reduce((total, row) => total + (Number(row.targetValue) || 0), 0),
    [milestoneRows],
  );
  const milestoneRemaining = (goal?.target_value ?? 0) - milestoneTotal;
  const milestonesMatchGoal =
    goal !== null && Math.abs(milestoneTotal - goal.target_value) < 0.000001;

  function updateMilestoneRow(key: number, patch: Partial<Omit<MilestoneRow, "key">>) {
    setMilestoneRows((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function addMilestoneRow() {
    setMilestoneRows((rows) => [
      ...rows,
      createEmptyMilestoneRow(Math.max(0, ...rows.map((row) => row.key)) + 1),
    ]);
  }

  function removeMilestoneRow(key: number) {
    setMilestoneRows((rows) => rows.filter((row) => row.key !== key));
  }

  async function handleCreateMilestones(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    if (!goal) {
      setError("Create a goal before adding milestones.");
      setSubmitting(false);
      return;
    }

    if (milestoneRows.length === 0) {
      setError("Add at least one milestone.");
      setSubmitting(false);
      return;
    }

    if (milestoneRows.some((row) => !row.title.trim())) {
      setError("Every milestone needs a title.");
      setSubmitting(false);
      return;
    }

    if (milestoneRows.some((row) => Number(row.targetValue) <= 0)) {
      setError("Every milestone target must be greater than 0.");
      setSubmitting(false);
      return;
    }

    if (!milestonesMatchGoal) {
      setError("Milestone target values must add up to the goal target value.");
      setSubmitting(false);
      return;
    }

    try {
      await createMilestones({
        milestones: milestoneRows.map((row, index) => ({
          title: row.title.trim(),
          target_value: Number(row.targetValue),
          order_index: index + 1,
        })),
      });

      await refreshDashboard();
    } catch (createMilestonesError) {
      setError(getErrorMessage(createMilestonesError));
    } finally {
      setSubmitting(false);
    }
  }

  async function openAddProgress() {
    setError("");
    setTrackingAmount("");
    setTrackingDate(getTodayInputValue());
    setSelectedMilestoneId("");

    if (!summary) {
      await refreshDashboard();
    }

    setView("add-progress");
  }

  async function handleAddProgress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const amount = Number(trackingAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Amount must be greater than 0.");
      setSubmitting(false);
      return;
    }

    if (summary?.has_milestones && !selectedMilestoneId) {
      setError("Select a milestone for this progress record.");
      setSubmitting(false);
      return;
    }

    try {
      await addTracking({
        amount,
        date: trackingDate,
        ...(summary?.has_milestones ? { milestone_id: Number(selectedMilestoneId) } : {}),
      });

      setTrackingAmount("");
      setSelectedMilestoneId("");
      await refreshDashboard();
    } catch (addProgressError) {
      setError(getErrorMessage(addProgressError));
    } finally {
      setSubmitting(false);
    }
  }

  async function openHistory() {
    setLoading(true);
    setError("");

    try {
      const [nextHistory, nextMilestones] = await Promise.all([
        getTrackingHistory(),
        summary?.has_milestones ? getMilestones() : Promise.resolve(milestones),
      ]);
      setHistory(nextHistory);
      setMilestones(nextMilestones);
      setView("history");
    } catch (historyError) {
      setError(getErrorMessage(historyError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      if (!userId) {
        setLoading(false);
        setView("setup");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const existingGoal = await getGoal();
        const dashboardData = await fetchDashboardData();

        if (!isMounted) {
          return;
        }

        setGoal(existingGoal);
        applyDashboardData(dashboardData);
        setView("dashboard");
      } catch (bootstrapError) {
        if (!isMounted) {
          return;
        }

        if (bootstrapError instanceof ApiError && bootstrapError.status === 404) {
          setGoal(null);
          setSummary(null);
          setMilestones([]);
          setHistory([]);
          setView("create-goal");
        } else {
          setError(getErrorMessage(bootstrapError));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (loading && view !== "setup") {
    return (
      <AppShell>
        <Card>
          <p className="eyebrow">Loading</p>
          <h1>Getting your goal ready</h1>
          <p className="muted">Checking your saved test user and progress.</p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {error && <ErrorMessage message={error} />}

      {view === "setup" && (
        <Card centered>
          <p className="eyebrow">Goal Tracker</p>
          <h1>Goal Tracker</h1>
          <p className="lede">Track one measurable goal and see your progress clearly.</p>
          <button className="primary-button" onClick={handleCreateUser} disabled={submitting}>
            {submitting ? "Creating..." : "Create Test User"}
          </button>
        </Card>
      )}

      {view === "create-goal" && (
        <Card>
          <p className="eyebrow">Step 1</p>
          <h1>Create Goal</h1>
          <form className="form-stack" onSubmit={handleCreateGoal}>
            <label>
              Goal title
              <input
                value={goalForm.title}
                onChange={(event) => setGoalForm({ ...goalForm, title: event.target.value })}
                placeholder="Learn Machine Learning"
              />
            </label>

            <div className="two-column">
              <label>
                Goal type
                <select
                  value={goalForm.goalType}
                  onChange={(event) =>
                    setGoalForm({ ...goalForm, goalType: event.target.value as GoalType })
                  }
                >
                  <option value="hours">hours</option>
                  <option value="count">count</option>
                </select>
              </label>

              <label>
                Target value
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={goalForm.targetValue}
                  onChange={(event) =>
                    setGoalForm({ ...goalForm, targetValue: event.target.value })
                  }
                />
              </label>
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={goalForm.wantsMilestones}
                onChange={(event) =>
                  setGoalForm({ ...goalForm, wantsMilestones: event.target.checked })
                }
              />
              Divide this goal into milestones?
            </label>

            <button className="primary-button" disabled={submitting}>
              {submitting ? "Creating..." : "Create Goal"}
            </button>
          </form>
        </Card>
      )}

      {view === "milestones" && goal && (
        <Card wide>
          <p className="eyebrow">Step 2</p>
          <h1>Milestone Setup</h1>
          <p className="muted">
            Goal target: <strong>{formatNumber(goal.target_value)}</strong> {goal.goal_type}
          </p>

          <form className="form-stack" onSubmit={handleCreateMilestones}>
            <div className="milestone-list">
              {milestoneRows.map((row, index) => (
                <div className="milestone-row" key={row.key}>
                  <span className="milestone-order">Milestone {index + 1}</span>
                  <input
                    value={row.title}
                    onChange={(event) => updateMilestoneRow(row.key, { title: event.target.value })}
                    placeholder="Milestone title"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.targetValue}
                    onChange={(event) =>
                      updateMilestoneRow(row.key, { targetValue: event.target.value })
                    }
                    placeholder="Target"
                  />
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => removeMilestoneRow(row.key)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button className="secondary-button" type="button" onClick={addMilestoneRow}>
              Add Milestone
            </button>

            <div className="summary-grid">
              <Metric label="Total milestone value" value={formatNumber(milestoneTotal)} />
              <Metric label="Remaining value" value={formatNumber(milestoneRemaining)} />
            </div>

            <button className="primary-button" disabled={submitting || !milestonesMatchGoal}>
              {submitting ? "Saving..." : "Create Milestones"}
            </button>
          </form>
        </Card>
      )}

      {view === "dashboard" && summary && (
        <Card wide>
          <div className="dashboard-header">
            <div>
              <p className="eyebrow">Dashboard</p>
              <h1>{summary.title}</h1>
              <p className="muted">Goal type: {summary.goal_type}</p>
            </div>
            <div className="button-row">
              <button className="secondary-button" onClick={openHistory}>
                View History
              </button>
              <button className="primary-button" onClick={openAddProgress}>
                Add Progress
              </button>
            </div>
          </div>

          <div className="summary-grid">
            <Metric
              label="Progress"
              value={`${formatNumber(summary.total_progress)} / ${formatNumber(summary.target_value)}`}
            />
            <Metric label="Remaining" value={formatNumber(summary.remaining)} />
            <Metric label="Progress percent" value={`${formatNumber(summary.progress_percent)}%`} />
            <Metric
              label="Estimated days left"
              value={
                summary.estimated_days_left === null
                  ? "Not enough data"
                  : formatNumber(summary.estimated_days_left)
              }
            />
          </div>

          {summary.has_milestones ? (
            <SegmentedProgress milestones={milestones} />
          ) : (
            <ProgressBar percent={summary.progress_percent} />
          )}
        </Card>
      )}

      {view === "add-progress" && summary && (
        <Card>
          <p className="eyebrow">New entry</p>
          <h1>Add Progress</h1>
          <form className="form-stack" onSubmit={handleAddProgress}>
            <label>
              Amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={trackingAmount}
                onChange={(event) => setTrackingAmount(event.target.value)}
              />
            </label>

            <label>
              Date
              <input
                type="date"
                value={trackingDate}
                onChange={(event) => setTrackingDate(event.target.value)}
              />
            </label>

            {summary.has_milestones && (
              <label>
                Milestone
                <select
                  value={selectedMilestoneId}
                  onChange={(event) => setSelectedMilestoneId(event.target.value)}
                >
                  <option value="">Select milestone</option>
                  {milestones.map((milestone) => (
                    <option key={milestone.id} value={milestone.id}>
                      Milestone {milestone.order_index}: {milestone.title}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="button-row">
              <button className="secondary-button" type="button" onClick={() => setView("dashboard")}>
                Back
              </button>
              <button className="primary-button" disabled={submitting}>
                {submitting ? "Saving..." : "Save Progress"}
              </button>
            </div>
          </form>
        </Card>
      )}

      {view === "history" && (
        <Card wide>
          <div className="dashboard-header">
            <div>
              <p className="eyebrow">History</p>
              <h1>Tracking Records</h1>
            </div>
            <button className="secondary-button" onClick={() => setView("dashboard")}>
              Back to Dashboard
            </button>
          </div>

          {history.length === 0 ? (
            <p className="empty-state">No progress has been added yet.</p>
          ) : (
            <div className="history-list">
              {history.map((entry) => {
                const milestone = milestones.find((item) => item.id === entry.milestone_id);

                return (
                  <div className="history-item" key={entry.id}>
                    <div>
                      <strong>{formatNumber(entry.amount)}</strong>
                      <span>{entry.date}</span>
                    </div>
                    {entry.milestone_id && (
                      <p>
                        {milestone
                          ? `Milestone ${milestone.order_index}: ${milestone.title}`
                          : `Milestone ID ${entry.milestone_id}`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </AppShell>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  return <main className="app-shell">{children}</main>;
}

function Card({ children, centered = false, wide = false }: {
  children: React.ReactNode;
  centered?: boolean;
  wide?: boolean;
}) {
  return <section className={`card ${centered ? "centered-card" : ""} ${wide ? "wide-card" : ""}`}>{children}</section>;
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="error-message">{message}</div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="progress-wrap">
      <div className="progress-label">
        <span>Main progress</span>
        <strong>{formatNumber(percent)}%</strong>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${clampPercent(percent)}%` }} />
      </div>
    </div>
  );
}

function SegmentedProgress({ milestones }: { milestones: Milestone[] }) {
  return (
    <div className="segmented-area">
      <div className="segmented-track">
        {milestones.map((milestone) => (
          <div
            className="segment"
            key={milestone.id}
            style={{ flexBasis: `${clampPercent(milestone.bar_width_percent)}%` }}
          >
            <div
              className="segment-fill"
              style={{ width: `${clampPercent(milestone.progress_percent)}%` }}
            />
          </div>
        ))}
      </div>

      <div className="segment-labels">
        {milestones.map((milestone) => (
          <div
            className="segment-label"
            key={milestone.id}
            style={{ flexBasis: `${clampPercent(milestone.bar_width_percent)}%` }}
          >
            <strong>
              Milestone {milestone.order_index}: {milestone.title}
            </strong>
            <span>{formatNumber(milestone.progress_percent)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
