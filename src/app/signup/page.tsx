"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../login/login.module.css"; // ✅ Reuse the login styles

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(form),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Signup failed");
    } else {
      setSuccess("Signup successful! Redirecting to login...");
      setTimeout(() => router.push("/login"), 1500);
    }
  };

  const goToLogin = () => router.push("/login");

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        {/* Left Panel */}
        <div className={styles.loginLeft}>
          <h2 className={styles.title}>Join the Journey</h2>
          <p className={styles.subtitle}>
            Unlock exclusive features and be part of a growing community. Sign up now and elevate your game.
          </p>
        </div>

        {/* Right Panel (Signup Form) */}
        <div className={styles.loginRight}>
          <form onSubmit={handleSignup} style={{ width: "100%" }}>
            <h2 className={styles.formTitle}>Sign Up</h2>
            <div>
              <input
                type="text"
                placeholder="Name"
                className={styles.inputField}
                value={form.name}
                required
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Email"
                className={styles.inputField}
                value={form.email}
                required
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                className={styles.inputField}
                value={form.password}
                required
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            {success && <p className="text-green-400 mt-2">{success}</p>}
            <button type="submit" className={styles.loginButton}>
              Sign Up
            </button>
            <div className={styles.signupOption}>
              <p>Already have an account?</p>
              <button type="button" onClick={goToLogin} className={styles.signupButton}>
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
