"use client";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
      setError(res.error);
    } else {
      router.push("/dashboard");
    }
  };

  const handleSignUp = () => {
    router.push("/signup");
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        {/* Left Panel */}
        <div className={styles.loginLeft}>
          <h2 className={styles.title}>Welcome Back</h2>
          <p className={styles.subtitle}>
            Discover new strategies and insights to elevate your journey. Let's get started!
          </p>
        </div>

        {/* Right Panel */}
        <div className={styles.loginRight}>
          <form onSubmit={handleLogin} style={{ width: "100%", maxWidth: "350px" }}>
            <div>
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={styles.inputField}
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={styles.inputField}
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" disabled={loading} className={styles.loginButton}>
              {loading ? "Logging in..." : "Login"}
            </button>
            <div className={styles.signupOption}>
              <p>Don't have an account?</p>
              <button type="button" onClick={handleSignUp} className={styles.signupButton}>
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
