import "./App.css";
import { useState, useRef, useEffect, useMemo } from "react";

/* ── Helpers ── */
const getSurgeClass = (val) => {
  const n = parseFloat(val);
  if (n < 1.5) return "surge-low";
  if (n < 2.5) return "surge-medium";
  return "surge-high";
};

const getSurgeLabel = (val) => {
  const n = parseFloat(val);
  if (n < 1.5) return "✅ Normal";
  if (n < 2.5) return "⚠️ Moderate";
  return "🔴 High Surge";
};

const getMeterPct = (val) => {
  const n = parseFloat(val);
  // Assume max meaningful surge ~= 4x → maps to 100%
  return Math.min(100, ((n - 1) / 3) * 100);
};

const getWeatherIcon = (weather) => {
  const map = { Rainy: "🌧️", Clear: "☀️", Cloudy: "☁️", Windy: "💨", Foggy: "🌫️" };
  return map[weather] || "🌤️";
};

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const getDayName = (val) => DAY_NAMES[parseInt(val)] ?? String(val);

const getDayIcon = (day) => {
  const name = typeof day === "number" ? getDayName(day) : day;
  const map = { Monday: "📅", Tuesday: "📅", Wednesday: "📅", Thursday: "📅", Friday: "🎉", Saturday: "🎊", Sunday: "😴" };
  return map[name] || "📅";
};

/* ── Particle Canvas ── */
function Particles() {
  const particles = useMemo(() => {
    return Array.from({ length: 22 }, (_, i) => ({
      id: i,
      size: Math.random() * 4 + 1.5,
      left: `${Math.random() * 100}%`,
      color: i % 3 === 0 ? "rgba(61,224,255," : i % 3 === 1 ? "rgba(168,85,247," : "rgba(99,102,241,",
      delay: `${Math.random() * 20}s`,
      duration: `${Math.random() * 15 + 12}s`,
      opacity: Math.random() * 0.5 + 0.15,
    }));
  }, []);

  return (
    <div className="particles" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            width: p.size,
            height: p.size,
            left: p.left,
            background: `${p.color}${p.opacity})`,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}0.4)`,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

/* ── Field ── */
function Field({ label, icon, children }) {
  return (
    <div className="field">
      <span className="field-label">
        <span className="field-label-icon">{icon}</span>
        {label}
      </span>
      {children}
    </div>
  );
}

/* ── TextInput ── */
function TextInput({ icon, ...props }) {
  return (
    <div className="field-input-wrap">
      <span className="field-icon">{icon}</span>
      <input type="text" {...props} />
    </div>
  );
}

/* ── NumberInput ── */
function NumberInput({ icon, ...props }) {
  return (
    <div className="field-input-wrap">
      <span className="field-icon">{icon}</span>
      <input type="number" {...props} />
    </div>
  );
}

/* ── SelectInput ── */
function SelectInput({ icon, children, ...props }) {
  return (
    <div className="field-input-wrap select-wrap">
      <span className="field-icon">{icon}</span>
      <select {...props}>{children}</select>
    </div>
  );
}

/* ── SliderInput ── */
function SliderInput({ label, icon, value, min, max, step, onChange }) {
  return (
    <div className="slider-field">
      <div className="slider-header">
        <span className="field-label">
          <span className="field-label-icon">{icon}</span>
          {label}
        </span>
        <span className="slider-val">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Main App
   ════════════════════════════════════════════════════════════ */
function App() {
  const [pickupLocation,   setPickupLocation]   = useState("");
  const [dropLocation,     setDropLocation]     = useState("");
  const [rideType,         setRideType]         = useState("");
  const [Event,            setEvent]            = useState("");

  const [result,        setResult]        = useState("");
  const [processedData, setProcessedData] = useState(null);
  const [error,         setError]         = useState("");
  const [loading,       setLoading]       = useState(false);

  const resultRef = useRef(null);

  const isValid = pickupLocation && dropLocation && rideType && Event;

  const handleSubmit = async () => {
    if (!isValid) return;

    setLoading(true);
    setError("");
    setResult("");
    setProcessedData(null);

    const data = {
      Pickup_Location: pickupLocation,
      Drop_Location:   dropLocation,
      Ride_Type:       rideType,
      Event:           Event,
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to get prediction");

      const resData = await response.json();
      setResult(resData.surge_multiplier);
      setProcessedData(resData.processed_data);
    } catch (err) {
      console.error(err);
      setError("Unable to reach the prediction server. Please make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  /* Scroll into view when result appears */
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const surgeClass = result ? getSurgeClass(result) : "";
  const meterPct   = result ? getMeterPct(result) : 0;

  return (
    <div className="app-canvas">
      {/* ── Animated background ── */}
      <div className="bg-mesh" aria-hidden="true" />
      <Particles />

      <div className="page-wrapper">
        {/* ── Top Nav ── */}
        <nav className="topnav" aria-label="Site navigation">
          <div className="nav-logo">
            <div className="nav-logo-icon" aria-hidden="true">⚡</div>
            <span className="nav-logo-text">SurgeSense</span>
          </div>
          <div className="nav-badge" aria-label="Model status: live">
            <span className="nav-badge-dot" aria-hidden="true" />
            ML Model Live
          </div>
        </nav>

        {/* ══════════════════════════════════════════
            Hero
        ══════════════════════════════════════════ */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-left">
            <div className="hero-tag" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M6 3v3l2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Real-time AI Prediction
            </div>

            <h1 className="hero-title" id="hero-title">
              <span className="hero-title-plain">Know the surge</span>
              <span className="hero-title-grad">before you ride.</span>
            </h1>

            <p className="hero-desc">
              SurgeSense uses a trained machine-learning model to predict ride-hailing
              surge multipliers based on real-time demand, traffic, events, and city conditions.
            </p>

            <div className="hero-stats" aria-label="Platform stats">
              <div className="stat-item">
                <span className="stat-value">98%</span>
                <span className="stat-label">Accuracy</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">&lt;200ms</span>
                <span className="stat-label">Response</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">5+</span>
                <span className="stat-label">Cities</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-orb hero-orb-1" />
            <div className="hero-orb hero-orb-2" />
            <div className="hero-card" role="presentation">
              <div className="hero-card-header">
                <span className="hero-card-title">Live Prediction</span>
                <span className="hero-card-live">
                  <span className="hero-card-live-dot" />
                  Active
                </span>
              </div>
              <div className="hero-surge-display">
                <div className="hero-surge-value">2.4×</div>
                <div className="hero-surge-label">Surge Multiplier</div>
              </div>
              <div className="hero-mini-grid">
                <div className="hero-mini-item">
                  <div className="hero-mini-label">City</div>
                  <div className="hero-mini-val">Hyderabad</div>
                </div>
                <div className="hero-mini-item">
                  <div className="hero-mini-label">Weather</div>
                  <div className="hero-mini-val">🌧️ Rainy</div>
                </div>
                <div className="hero-mini-item">
                  <div className="hero-mini-label">Distance</div>
                  <div className="hero-mini-val">14.3 km</div>
                </div>
                <div className="hero-mini-item">
                  <div className="hero-mini-label">Event</div>
                  <div className="hero-mini-val">IPL Match</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="section-divider" role="separator" />

        {/* ══════════════════════════════════════════
            Prediction Form
        ══════════════════════════════════════════ */}
        <section className="form-section" aria-labelledby="form-title">
          <div className="section-label" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <rect width="12" height="12" rx="3" />
            </svg>
            Surge Predictor
          </div>
          <h2 className="section-title" id="form-title">Enter your ride details</h2>
          <p className="section-subtitle">
            Fill in the form below and our AI model will predict the surge pricing multiplier instantly.
          </p>

          <div className="form-card" role="form" aria-label="Ride details form">
            {/* Group 1 — Route */}
            <div className="form-group-label">📍 Route Details</div>
            <div className="field-grid">
              <Field label="Pickup Location" icon="🛖">
                <TextInput
                  id="pickup-location"
                  icon="📍"
                  placeholder="e.g. Hyderabad, Jubilee Hills"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  aria-label="Pickup location"
                  autoComplete="off"
                />
              </Field>

              <Field label="Drop Location" icon="🏁">
                <TextInput
                  id="drop-location"
                  icon="🏁"
                  placeholder="e.g. Mumbai, Bandra West"
                  value={dropLocation}
                  onChange={(e) => setDropLocation(e.target.value)}
                  aria-label="Drop location"
                  autoComplete="off"
                />
              </Field>

              <Field label="Ride Type" icon="🚗">
                <SelectInput
                  id="ride-type"
                  icon="🚗"
                  value={rideType}
                  onChange={(e) => setRideType(e.target.value)}
                  aria-label="Ride type"
                >
                  <option value="">Select type</option>
                  <option value="Economy">Economy</option>
                  <option value="Premium">Premium</option>
                  <option value="Luxury">Luxury</option>
                </SelectInput>
              </Field>
            </div>

            {/* Group 2 — Context */}
            <div className="form-group-label" style={{ marginTop: "8px" }}>🌐 Ride Context</div>
            <div className="field-grid-2">
              <Field label="Local Event" icon="🎉">
                <SelectInput
                  id="event"
                  icon="🎉"
                  value={Event}
                  onChange={(e) => setEvent(e.target.value)}
                  aria-label="Local event"
                >
                  <option value="">Select event</option>
                  <option value="None">None</option>
                  <option value="Concert">Concert</option>
                  <option value="IPL Match">IPL Match</option>
                  <option value="Festival">Festival</option>
                  <option value="Political Rally">Political Rally</option>
                </SelectInput>
              </Field>

              {/* Placeholder for alignment */}
              <div />
            </div>



            {/* Submit */}
            <div className="predict-row">
              <button
                id="predict-btn"
                className="predict-btn"
                onClick={handleSubmit}
                disabled={!isValid || loading}
                aria-label="Predict surge multiplier"
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <span className="predict-btn-spinner" aria-hidden="true" />
                    Predicting…
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M8 2l6 4-6 4V2z" fill="white" />
                      <path d="M2 6h4M2 10h8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    Predict Surge
                  </>
                )}
              </button>
              {!isValid && (
                <p className="predict-hint" aria-live="polite">
                  Fill in pickup, drop, ride type & event to predict.
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="error-block" role="alert" aria-live="assertive">
                <span className="error-icon" aria-hidden="true">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="result-block" ref={resultRef} aria-live="polite" aria-label="Prediction result">
                <div className="result-header">
                  <div className="result-header-left">
                    <div className="result-eyebrow">Predicted Surge Multiplier</div>
                    <div className={`result-multiplier ${surgeClass}`}>
                      {parseFloat(result).toFixed(2)}×
                    </div>
                  </div>
                  <div className={`result-badge ${surgeClass}`}>
                    {getSurgeLabel(result)}
                  </div>
                </div>

                {/* Surge Meter */}
                <div className="surge-meter">
                  <div className="surge-meter-label">
                    <span>1.0×</span>
                    <span>Surge intensity</span>
                    <span>4.0×</span>
                  </div>
                  <div className="surge-meter-track" role="progressbar" aria-valuenow={meterPct} aria-valuemin={0} aria-valuemax={100}>
                    <div
                      className={`surge-meter-fill ${surgeClass}`}
                      style={{ width: `${meterPct}%` }}
                    />
                  </div>
                </div>

                {/* Enriched Data */}
                {processedData && (
                  <div className="enriched-grid" aria-label="Enriched ride data">
                    <div className="enriched-item">
                      <span className="enriched-item-icon" aria-hidden="true">🏙️</span>
                      <span className="enriched-item-label">City</span>
                      <span className="enriched-item-val">{processedData.City}</span>
                    </div>
                    <div className="enriched-item">
                      <span className="enriched-item-icon" aria-hidden="true">{getWeatherIcon(processedData.Weather)}</span>
                      <span className="enriched-item-label">Weather</span>
                      <span className="enriched-item-val">{processedData.Weather}</span>
                    </div>
                    <div className="enriched-item">
                      <span className="enriched-item-icon" aria-hidden="true">📍</span>
                      <span className="enriched-item-label">Distance</span>
                      <span className="enriched-item-val">{processedData.Ride_Distance_KM} km</span>
                    </div>
                    <div className="enriched-item">
                      <span className="enriched-item-icon" aria-hidden="true">{getDayIcon(processedData.Day_of_Week)}</span>
                      <span className="enriched-item-label">Day</span>
                      <span className="enriched-item-val">{getDayName(processedData.Day_of_Week)}</span>
                    </div>
                    <div className="enriched-item">
                      <span className="enriched-item-icon" aria-hidden="true">⏰</span>
                      <span className="enriched-item-label">Hour</span>
                      <span className="enriched-item-val">{processedData.Hour_of_Day}:00</span>
                    </div>
                    <div className="enriched-item">
                      <span className="enriched-item-icon" aria-hidden="true">🚦</span>
                      <span className="enriched-item-label">Traffic Delay</span>
                      <span className="enriched-item-val">{processedData.Traffic_Delay} min</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="app-footer">
          <p>
            Built with ❤️ by <span>SurgeSense</span> · Powered by a custom ML model trained on ride-demand data
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
