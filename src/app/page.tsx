"use client";

import { useState } from "react";

export default function Home() {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Inter', sans-serif;
          background: #0f0f14;
          min-height: 100vh;
        }

        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #0f0f14 0%, #1a1025 50%, #0f1a14 100%);
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
          animation: float 8s ease-in-out infinite;
        }
        .blob-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #7c3aed, #4f46e5);
          top: -100px; left: -100px;
          animation-delay: 0s;
        }
        .blob-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #059669, #0891b2);
          bottom: -80px; right: -80px;
          animation-delay: -3s;
        }
        .blob-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, #db2777, #9333ea);
          top: 50%; left: 60%;
          animation-delay: -6s;
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }

        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        .card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          margin: 24px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.04), 0 32px 64px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3);
          padding: 40px;
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
        .logo-icon {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
        }
        .logo-text { font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }
        .logo-sub { font-size: 12px; color: rgba(255,255,255,0.35); font-weight: 400; letter-spacing: 0.5px; margin-top: -2px; }

        .badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px;
          background: rgba(5, 150, 105, 0.12);
          border: 1px solid rgba(5, 150, 105, 0.2);
          border-radius: 20px;
          font-size: 11px; font-weight: 500; color: #34d399;
          margin-bottom: 16px;
        }
        .badge-dot {
          width: 5px; height: 5px;
          background: #34d399; border-radius: 50%;
          box-shadow: 0 0 4px #34d399;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .headline { font-size: 26px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; line-height: 1.2; margin-bottom: 8px; }
        .subheadline { font-size: 14px; color: rgba(255,255,255,0.4); margin-bottom: 24px; line-height: 1.5; }

        .tabs {
          display: flex;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 4px; margin-bottom: 24px; gap: 4px;
        }
        .tab-btn {
          flex: 1; padding: 9px 16px; border-radius: 9px; border: none;
          font-family: inherit; font-size: 14px; font-weight: 500;
          cursor: pointer; transition: all 0.2s ease;
          color: rgba(255,255,255,0.4); background: transparent;
        }
        .tab-btn.active {
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.35);
        }
        .tab-btn:not(.active):hover { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.05); }

        .form { display: flex; flex-direction: column; gap: 14px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        label { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.5); letter-spacing: 0.3px; text-transform: uppercase; }

        .input-wrap { position: relative; }
        .input-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: rgba(255,255,255,0.25); font-size: 15px;
          pointer-events: none; user-select: none;
        }
        input {
          width: 100%; padding: 12px 14px 12px 40px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; color: #ffffff;
          font-family: inherit; font-size: 14px; outline: none;
          transition: all 0.2s ease;
        }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:focus {
          background: rgba(255,255,255,0.07);
          border-color: rgba(124, 58, 237, 0.6);
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
        }
        .eye-btn {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.25); font-size: 15px;
          padding: 4px; transition: color 0.2s; font-family: inherit;
        }
        .eye-btn:hover { color: rgba(255,255,255,0.55); }

        .forgot-link { text-align: right; margin-top: -6px; }
        .forgot-link a { font-size: 12px; color: rgba(124,58,237,0.8); text-decoration: none; transition: color 0.2s; }
        .forgot-link a:hover { color: #7c3aed; }

        .divider { display: flex; align-items: center; gap: 12px; color: rgba(255,255,255,0.18); font-size: 12px; }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.08); }

        .submit-btn {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
          border: none; border-radius: 12px;
          color: #ffffff; font-family: inherit; font-size: 15px; font-weight: 600;
          cursor: pointer; transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(124, 58, 237, 0.35);
          letter-spacing: -0.2px; position: relative; overflow: hidden;
        }
        .submit-btn::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
          opacity: 0; transition: opacity 0.2s;
        }
        .submit-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(124, 58, 237, 0.45); }
        .submit-btn:hover::after { opacity: 1; }
        .submit-btn:active { transform: translateY(0); }

        .social-btn {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          padding: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; color: rgba(255,255,255,0.7);
          font-family: inherit; font-size: 14px; font-weight: 500;
          cursor: pointer; transition: all 0.2s ease; width: 100%;
        }
        .social-btn:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.12); color: #ffffff; }

        .terms-note { font-size: 11.5px; color: rgba(255,255,255,0.2); text-align: center; line-height: 1.6; }
        .terms-note a { color: rgba(255,255,255,0.4); text-decoration: underline; text-underline-offset: 2px; }

        .footer-note { text-align: center; margin-top: 20px; font-size: 13px; color: rgba(255,255,255,0.25); }
        .footer-note a { color: rgba(124,58,237,0.8); text-decoration: none; font-weight: 500; transition: color 0.2s; }
        .footer-note a:hover { color: #7c3aed; }
      `}</style>

      <div className="page">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="grid-overlay" />

        <div className="card">
          <div className="logo">
            <div className="logo-icon">💸</div>
            <div>
              <div className="logo-text">Splitwise</div>
              <div className="logo-sub">Expense Management</div>
            </div>
          </div>

          <div className="badge">
            <div className="badge-dot" />
            Secure encrypted connection
          </div>

          <h1 className="headline">
            {tab === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="subheadline">
            {tab === "signin"
              ? "Sign in to track and split your shared expenses."
              : "Start managing shared expenses with your group."}
          </p>

          <div className="tabs" role="tablist">
            <button
              id="tab-signin"
              role="tab"
              aria-selected={tab === "signin"}
              className={`tab-btn${tab === "signin" ? " active" : ""}`}
              onClick={() => setTab("signin")}
            >
              Sign In
            </button>
            <button
              id="tab-signup"
              role="tab"
              aria-selected={tab === "signup"}
              className={`tab-btn${tab === "signup" ? " active" : ""}`}
              onClick={() => setTab("signup")}
            >
              Create Account
            </button>
          </div>

          <form className="form" onSubmit={(e) => e.preventDefault()}>
            {tab === "signup" && (
              <div className="field-row">
                <div className="field">
                  <label htmlFor="first-name">First Name</label>
                  <div className="input-wrap">
                    <span className="input-icon">👤</span>
                    <input id="first-name" type="text" placeholder="Alice" autoComplete="given-name" />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="last-name">Last Name</label>
                  <div className="input-wrap">
                    <span className="input-icon">👤</span>
                    <input id="last-name" type="text" placeholder="Smith" autoComplete="family-name" />
                  </div>
                </div>
              </div>
            )}

            <div className="field">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrap">
                <span className="input-icon">✉️</span>
                <input id="email" type="email" placeholder="you@example.com" autoComplete="email" />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <span className="input-icon">🔒</span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={tab === "signin" ? "Your password" : "Min. 8 characters"}
                  autoComplete={tab === "signin" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  id="toggle-password"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {tab === "signin" && (
              <div className="forgot-link">
                <a href="#forgot">Forgot password?</a>
              </div>
            )}

            <button type="submit" id="submit-btn" className="submit-btn">
              {tab === "signin" ? "Sign In →" : "Create Account →"}
            </button>

            <div className="divider">or continue with</div>

            <button type="button" id="google-btn" className="social-btn">
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                <path d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3L37.3 9.6C34 6.6 29.2 4.8 24 4.8 12.8 4.8 3.8 13.8 3.8 25S12.8 45.2 24 45.2c11 0 19.8-8 19.8-20.2 0-1.5-.1-2.6-.2-4.5z" fill="#FFC107"/>
                <path d="M6.3 15.6l6.6 4.8C14.6 17 19 14 24 14c3 0 5.8 1.1 7.9 3l5.4-5.4C34 8.6 29.2 6.8 24 6.8c-7.6 0-14.1 4.4-17.7 8.8z" fill="#FF3D00"/>
                <path d="M24 45.2c5.1 0 9.7-1.9 13.2-5l-6.1-5.2C29 36.9 26.6 38 24 38c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.8 41.2 16.5 45.2 24 45.2z" fill="#4CAF50"/>
                <path d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.1 5.2C39 37.2 44 31.5 44 24.8c0-1.5-.1-2.6-.4-4.3z" fill="#1976D2"/>
              </svg>
              Continue with Google
            </button>

            {tab === "signup" && (
              <p className="terms-note">
                By creating an account, you agree to our{" "}
                <a href="#terms">Terms of Service</a> and{" "}
                <a href="#privacy">Privacy Policy</a>.
              </p>
            )}
          </form>

          <p className="footer-note">
            {tab === "signin" ? (
              <>Don&apos;t have an account?{" "}
                <a href="#" onClick={(e) => { e.preventDefault(); setTab("signup"); }}>
                  Sign up free
                </a>
              </>
            ) : (
              <>Already have an account?{" "}
                <a href="#" onClick={(e) => { e.preventDefault(); setTab("signin"); }}>
                  Sign in
                </a>
              </>
            )}
          </p>
        </div>
      </div>
    </>
  );
}

