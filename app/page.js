"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  authenticate,
  isLoggedIn,
  getCurrentUser,
  resetPassword,
} from "@/services/userService";
import { initStorage } from "@/api/api";

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    initStorage();
    isLoggedIn().then(async (loggedIn) => {
      if (loggedIn) {
        const user = await getCurrentUser();
        router.push(`/dashboard/${user.role}`);
      }
    });
  }, [router]);

  if (!mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await authenticate(email, password);

    if (result.success) {
      router.push(`/dashboard/${result.user.role}`);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setForgotMessage("");
    setLoading(true);
    try {
      const result = await resetPassword(forgotEmail, newPassword);
      setForgotMessage(result.message || "Password updated successfully");
      setForgotEmail("");
      setNewPassword("");
    } catch (err) {
      setError(err.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginPage">
      <div className="loginLeft">
        <div className="loginLeftOverlay"></div>
        <div className="loginLeftContent">
          <div className="loginBrand loginBrandRow">
            <span className="loginBrandIcon">SS</span>
            <span className="loginBrandName">Sole Sync</span>
          </div>
        </div>
        <div className="loginBgShapes">
          <div className="loginBgShape loginBgShape1"></div>
          <div className="loginBgShape loginBgShape2"></div>
          <div className="loginBgShape loginBgShape3"></div>
          <div className="loginBgShape loginBgShape4"></div>
        </div>
      </div>

      <div className="loginRight">
        <div className="loginCard">
          <div className="loginMobileLogo">
            <span className="loginBrandIcon loginBrandIconSm">SOLE</span>
            <span className="loginBrandName">Sole Sync</span>
          </div>

          <div className="loginFormHeader">
            <h2>Welcome back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          {error && <div className="errorMsg">{error}</div>}

          {!forgotMode ? (
            <form onSubmit={handleSubmit}>
              <div className="formGroup">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="formGroup">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="loginBtn" disabled={loading}>
                {loading ? (
                  <span className="loginBtnLoading">
                    <span className="loginSpinner"></span>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword}>
              <div className="formGroup">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
              <div className="formGroup">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="loginBtn" disabled={loading}>
                {loading ? (
                  <span className="loginBtnLoading">
                    <span className="loginSpinner"></span>
                    Updating...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          )}

          {forgotMessage && <div className="loginSuccessMsg">{forgotMessage}</div>}

          <div className="loginToggleWrap">
            <button
              type="button"
              onClick={() => {
                setForgotMode((prev) => !prev);
                setError("");
                setForgotMessage("");
              }}
              className="loginToggleBtn"
            >
              {forgotMode ? "Back to Login" : "Forgot Password?"}
            </button>
          </div>
        </div>

        <div className="loginFooter">
          <p>&copy; 2026 Sole Sync. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
