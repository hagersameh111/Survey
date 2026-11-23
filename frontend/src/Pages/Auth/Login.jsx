import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { login } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { authenticate } = useAuth();
  const [searchParams] = useSearchParams();

 const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const result = await login({ email, password });
      authenticate(result.token, result.user);
      const returnTo = searchParams.get("returnTo");
      navigate(returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <h2 className="mb-10 text-2xl font-bold text-gray-900 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">F</span>
        FormHub
      </h2>

      <form onSubmit={handleLogin} className="space-y-5">
        {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-sm outline-none transition focus:border-blue-600 focus:bg-white"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-sm outline-none transition focus:border-blue-600 focus:bg-white"
            required
          />
        </div>

        <div className="flex items-center justify-between py-1">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-500 cursor-pointer">
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-medium text-white transition hover:bg-blue-700 shadow-sm"
        >
          Login
        </button>
      </form>

      <p className="mt-8 text-center text-sm font-medium text-gray-500">
        Are you new?{" "}
        <Link to="/signup" className="text-blue-600 hover:underline">
          Create a new account
        </Link>
      </p>
    </div>
  );
};

export default Login;
