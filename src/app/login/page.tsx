"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    const res = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        {/* Left Panel */}
        <div className={styles.loginLeft}>
          <div className={styles.overlay}>
            <h2 className={styles.title}>Welcome Back</h2>
            <p className={styles.subtitle}>
              Explore your dashboard and continue your journey with strategy and
              focus.
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div className={styles.loginRight}>
          <h3 className={styles.formTitle}>Login</h3>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form onSubmit={handleLogin} className={styles.loginForm}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}