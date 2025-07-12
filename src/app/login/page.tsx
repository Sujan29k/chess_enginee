"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

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
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center px-4"
      style={{ backgroundImage: "url('/chess.jpeg')" }}
    >
      <div className="w-full max-w-6xl h-[650px] flex flex-col md:flex-row rounded-3xl shadow-2xl overflow-hidden backdrop-blur-md bg-white bg-opacity-90">
        {/* Welcome / Image Side */}
        <div className="md:w-1/2 relative hidden md:flex">
          <img
            src="/chess.jpeg"
            alt="Chess side"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-center text-white p-10">
            <h2 className="text-4xl font-bold mb-4 text-center">
              Welcome Back
            </h2>
            <p className="text-lg text-center max-w-sm">
              Explore your dashboard and continue your journey with strategy and
              focus.
            </p>
          </div>
        </div>

        {/* Login Form Side */}
        <div className="md:w-1/2 w-full p-10 flex items-center justify-center">
          <div className="w-full max-w-md">
            <h3 className="text-3xl font-semibold mb-6 text-center text-gray-800">
              Login
            </h3>

            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  placeholder="you@example.com"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  placeholder="••••••••"
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 text-white font-semibold rounded-lg transition ${
                  loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
