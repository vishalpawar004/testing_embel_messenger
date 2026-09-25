import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { login } from "../../../services/authService";
import "./AdminLogin.css";

const tokens = {
  bg: "#EFEBE1",
  border: "#E1DCD0",
  bubbleMine: "#fd7e13",
  bubbleTheirs: "#FFFFFF",
};

function BubbleField() {
  const bubbles = [
    { x: 60, y: 90, w: 190, mine: false },
    { x: 90, y: 150, w: 140, mine: false },
    { x: 280, y: 210, w: 170, mine: true },
    { x: 70, y: 270, w: 210, mine: false },
    { x: 300, y: 330, w: 130, mine: true },
    { x: 1300, y: 120, w: 160, mine: false },
    { x: 1360, y: 180, w: 190, mine: true },
    { x: 1290, y: 250, w: 130, mine: false },
    { x: 1370, y: 500, w: 170, mine: true },
    { x: 1290, y: 560, w: 150, mine: false },
    { x: 120, y: 560, w: 150, mine: true },
    { x: 60, y: 620, w: 190, mine: false },
    { x: 1310, y: 660, w: 160, mine: false },
  ];

  return (
    <svg className="cl-bubble-field" viewBox="0 0 1600 820" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="1600" height="820" fill={tokens.bg} />
      {bubbles.map((bubble, index) => (
        <g key={index} opacity=".9">
          <rect
            x={bubble.x}
            y={bubble.y}
            width={bubble.w}
            height="46"
            rx="14"
            fill={bubble.mine ? tokens.bubbleMine : tokens.bubbleTheirs}
            stroke={bubble.mine ? "none" : tokens.border}
          />
          <path
            d={
              bubble.mine
                ? `M ${bubble.x + bubble.w - 30} ${bubble.y + 42} L ${bubble.x + bubble.w - 20} ${bubble.y + 52} L ${bubble.x + bubble.w - 17} ${bubble.y + 42} Z`
                : `M ${bubble.x + 30} ${bubble.y + 42} L ${bubble.x + 20} ${bubble.y + 52} L ${bubble.x + 17} ${bubble.y + 42} Z`
            }
            fill={bubble.mine ? tokens.bubbleMine : tokens.bubbleTheirs}
            stroke={bubble.mine ? "none" : tokens.border}
            strokeLinejoin="round"
          />
          <rect
            x={bubble.x + 16}
            y={bubble.y + 13}
            width={bubble.w - 32}
            height="7"
            rx="4"
            fill={bubble.mine ? "rgba(255,255,255,.45)" : tokens.border}
          />
          <rect
            x={bubble.x + 16}
            y={bubble.y + 27}
            width={(bubble.w - 32) * 0.66}
            height="5"
            rx="3"
            fill={bubble.mine ? "rgba(255,255,255,.3)" : tokens.border}
          />
        </g>
      ))}
    </svg>
  );
}

export default function ChatLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    if (event) event.preventDefault();

    const next = {};
    if (!email.trim()) next.email = "Enter your email to continue.";
    if (!password.trim()) next.password = "Enter your password to continue.";
    setErrors(next);
    setFormError("");
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      // Redirect directly to /admin/chat
      navigate("/admin/chat");
    } catch (error) {
      setFormError(error.message || "Couldn't sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="cl-page">
      <BubbleField />
      <div className="cl-encryption">
        <span className="cl-encryption-dot" />End-to-end encrypted
      </div>
      <section className="cl-card" aria-label="Sign in">
        <h1 className="cl-title">Welcome back</h1>
        <p className="cl-subtitle">Sign in to pick up your conversations where you left off.</p>

        {formError && <p className="cl-error" role="alert">{formError}</p>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="cl-field">
            <label className="cl-label" htmlFor="login-email">Email</label>
            <div className="cl-input-wrap">
              <Mail className="cl-input-icon" size={16} />
              <input
                id="login-email"
                className={`cl-input ${errors.email ? "cl-input-error" : ""}`}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (errors.email) setErrors((previous) => ({ ...previous, email: undefined }));
                }}
              />
            </div>
            {errors.email && <p className="cl-error">{errors.email}</p>}
          </div>

          <div className="cl-field cl-password-field">
            <label className="cl-label" htmlFor="login-password">Password</label>
            <div className="cl-input-wrap">
              <Lock className="cl-input-icon" size={16} />
              <input
                id="login-password"
                className={`cl-input cl-input-password ${errors.password ? "cl-input-error" : ""}`}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (errors.password) setErrors((previous) => ({ ...previous, password: undefined }));
                }}
              />
              <button
                type="button"
                className="cl-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="cl-error">{errors.password}</p>}
          </div>

          <div className="cl-options">
            <label className="cl-remember">
              <input
                type="checkbox"
                className="cl-checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              Remember me
            </label>
            <a href="#" className="cl-link">Forgot password?</a>
          </div>

          <button type="submit" className="cl-button" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
            {!submitting && <ArrowRight size={16} />}
          </button>
        </form>

        <p className="cl-footer">
          New here? <a href="#" className="cl-link">Create an account</a>
        </p>
      </section>
    </main>
  );
}