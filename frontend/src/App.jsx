import { startTransition, useEffect, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

const DRIFT_DEFAULTS = {
  referenceWindow: 720,
  currentWindow: 168,
  rmseThreshold: 0.15,
};

function formatMetric(value, digits = 6) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }
  return Number(value).toFixed(digits);
}

function formatMoney(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString();
}

async function fetchJson(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || "Request failed.");
  }
  return response.json();
}

function SummaryCard({ title, value, hint, tone = "neutral", children }) {
  return (
    <article className={`panel panel-summary tone-${tone}`}>
      <div className="panel-kicker">{title}</div>
      <div className="panel-value">{value}</div>
      <div className="panel-hint">{hint}</div>
      {children}
    </article>
  );
}

function RunsTable({ runs }) {
  if (!runs.length) {
    return <div className="empty-state">No MLflow runs found.</div>;
  }

  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            <th>Experiment</th>
            <th>Run</th>
            <th>Status</th>
            <th>RMSE</th>
            <th>MAE</th>
            <th>R2</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.run_id}>
              <td>{run.experiment_name}</td>
              <td>{run.run_id.slice(0, 8)}...</td>
              <td>{run.status}</td>
              <td>{run.metrics.rmse ?? run.metrics.linear_rmse ?? "-"}</td>
              <td>{run.metrics.mae ?? run.metrics.linear_mae ?? "-"}</td>
              <td>{run.metrics.r2 ?? run.metrics.linear_r2 ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [driftLoading, setDriftLoading] = useState(false);
  const [driftForm, setDriftForm] = useState(DRIFT_DEFAULTS);

  const activeDrift = overview?.drift;
  const featurePsiEntries = Object.entries(activeDrift?.feature_psi || {})
    .filter(([, value]) => value !== null)
    .sort((a, b) => Number(b[1]) - Number(a[1]));

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      try {
        setLoading(true);
        setError("");
        const payload = await fetchJson("/dashboard/overview/");
        if (!cancelled) {
          startTransition(() => {
            setOverview(payload);
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOverview();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshOverview() {
    try {
      setLoading(true);
      setError("");
      const payload = await fetchJson("/dashboard/overview/");
      startTransition(() => {
        setOverview(payload);
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function checkDrift() {
    try {
      setDriftLoading(true);
      setError("");
      const payload = await fetchJson(
        `/model-drift/?reference_window=${driftForm.referenceWindow}&current_window=${driftForm.currentWindow}&rmse_alert_threshold=${driftForm.rmseThreshold}`,
      );

      startTransition(() => {
        setOverview((current) =>
          current
            ? {
                ...current,
                drift: payload,
              }
            : current,
        );
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setDriftLoading(false);
    }
  }

  const prediction = overview?.prediction;
  const performance = overview?.performance;
  const drift = overview?.drift;
  const modelMetrics = overview?.model_metrics;
  const runs = overview?.runs?.runs || [];
  const predictionTone = prediction ? (prediction.delta >= 0 ? "good" : "alert") : "neutral";
  const predictionHint = prediction
    ? `${prediction.delta >= 0 ? "+" : ""}${formatMoney(prediction.delta)} (${prediction.delta_pct}%)`
    : "Awaiting prediction data";
  const driftRatioValue = loading
    ? "..."
    : drift
      ? `${Number(drift.rmse_drift_ratio * 100).toFixed(2)}%`
      : "-";
  const driftTone = drift ? (drift.performance_drift_alert ? "alert" : "good") : "neutral";
  const driftHint = drift
    ? drift.performance_drift_alert
      ? "Performance alert active"
      : "No performance alert"
    : "Awaiting drift evaluation";
  const performanceHint = performance
    ? `MAE ${formatMetric(performance.mae)} | R2 ${formatMetric(performance.r2)}`
    : "Awaiting performance metrics";

  const delta = modelMetrics?.delta_arima_minus_linear;
  let betterModel = "-";
  if (delta) {
    const score = [delta.rmse, delta.mae]
      .filter((value) => value !== null && value !== undefined)
      .reduce((acc, value) => acc + Number(value), 0);

    if (score > 0) {
      betterModel = "Linear Regression";
    } else if (score < 0) {
      betterModel = "ARIMA";
    } else {
      betterModel = "Tie";
    }
  }

  return (
    <div className="page-shell">
      <div className="background-grid" />
      <div className="background-orb orb-left" />
      <div className="background-orb orb-right" />

      <main className="dashboard-layout">
        <section className="hero-card">
          <div>
            <p className="eyebrow">Django + React Deployment Console</p>
            <h1>BTC Forecast Operations Console</h1>
            <p className="hero-copy">
              Production-oriented monitoring for prediction quality, drift risk, and MLflow history.
            </p>
          </div>

          <div className="hero-actions">
            <button className="primary-button" onClick={refreshOverview} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh Metrics"}
            </button>
            <div className="hero-status">
              <span className={`status-dot ${error ? "status-dot-alert" : "status-dot-ok"}`} />
              {error ? error : "Backend reachable"}
            </div>
          </div>
        </section>

        <section className="summary-grid">
          <SummaryCard
            title="Next Hour Proxy"
            value={loading ? "..." : `$${formatMoney(prediction?.predicted_next_hour_close)}`}
            hint={predictionHint}
            tone={predictionTone}
          >
            <div className="micro-detail">Latest candle: {formatDate(prediction?.last_timestamp)}</div>
          </SummaryCard>

          <SummaryCard
            title="Recent RMSE"
            value={loading ? "..." : formatMetric(performance?.rmse)}
            hint={performanceHint}
            tone="neutral"
          />

          <SummaryCard
            title="Drift Ratio"
            value={driftRatioValue}
            hint={driftHint}
            tone={driftTone}
          >
            <div className="micro-detail">
              Flagged features: {drift?.feature_drift_alert_features?.length ?? 0}
            </div>
          </SummaryCard>
        </section>

        <section className="content-grid">
          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="panel-kicker">Model Scoreboard</p>
                <h2>Linear regression versus ARIMA</h2>
              </div>
            </div>

            <div className="comparison-grid">
              <div className="subpanel">
                <h3>Linear Regression</h3>
                <div className="metric-row"><span>RMSE</span><strong>{formatMetric(modelMetrics?.linear_regression?.rmse)}</strong></div>
                <div className="metric-row"><span>MAE</span><strong>{formatMetric(modelMetrics?.linear_regression?.mae)}</strong></div>
                <div className="metric-row"><span>R2</span><strong>{formatMetric(modelMetrics?.linear_regression?.r2)}</strong></div>
              </div>

              <div className="subpanel">
                <h3>ARIMA</h3>
                <div className="metric-row"><span>RMSE</span><strong>{formatMetric(modelMetrics?.arima?.rmse)}</strong></div>
                <div className="metric-row"><span>MAE</span><strong>{formatMetric(modelMetrics?.arima?.mae)}</strong></div>
                <div className="metric-row"><span>R2</span><strong>{formatMetric(modelMetrics?.arima?.r2)}</strong></div>
              </div>
            </div>

            <div className="delta-strip">
              <div>
                <span>RMSE delta</span>
                <strong>{formatMetric(modelMetrics?.delta_arima_minus_linear?.rmse)}</strong>
              </div>
              <div>
                <span>MAE delta</span>
                <strong>{formatMetric(modelMetrics?.delta_arima_minus_linear?.mae)}</strong>
              </div>
              <div>
                <span>Preferred model</span>
                <strong>{betterModel}</strong>
              </div>
            </div>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="panel-kicker">Drift Explorer</p>
                <h2>Adjust detection windows</h2>
              </div>
            </div>

            <div className="form-grid">
              <label>
                Reference window
                <input
                  type="number"
                  min="120"
                  max="5000"
                  value={driftForm.referenceWindow}
                  onChange={(event) =>
                    setDriftForm((current) => ({
                      ...current,
                      referenceWindow: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Current window
                <input
                  type="number"
                  min="24"
                  max="1000"
                  value={driftForm.currentWindow}
                  onChange={(event) =>
                    setDriftForm((current) => ({
                      ...current,
                      currentWindow: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                RMSE threshold
                <input
                  type="number"
                  min="0.01"
                  max="1"
                  step="0.01"
                  value={driftForm.rmseThreshold}
                  onChange={(event) =>
                    setDriftForm((current) => ({
                      ...current,
                      rmseThreshold: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <button className="primary-button drift-button" onClick={checkDrift} disabled={driftLoading}>
              {driftLoading ? "Running..." : "Check Drift"}
            </button>

            <div className="drift-ledger">
              {featurePsiEntries.length ? (
                featurePsiEntries.map(([feature, psi]) => (
                  <div className="drift-row" key={feature}>
                    <span>{feature}</span>
                    <strong className={Number(psi) >= 0.2 ? "text-alert" : Number(psi) >= 0.1 ? "text-warn" : "text-good"}>
                      {psi}
                    </strong>
                  </div>
                ))
              ) : (
                <div className="empty-state">No drift features available.</div>
              )}
            </div>
          </article>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">MLflow Activity</p>
              <h2>Recent experiment runs</h2>
            </div>
          </div>
          <RunsTable runs={runs} />
        </section>
      </main>
    </div>
  );
}
