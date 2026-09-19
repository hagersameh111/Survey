import { useState } from "react";
import { Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <h2 className="mb-10 text-2xl font-bold text-gray-900 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">F</span>
        FormHub
      </h2>

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-sm outline-none transition focus:border-blue-600 focus:bg-white"
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
          <Link to="/dashboard" className="w-full text-center">
          Login
          </Link>
        </button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-gray-200"></div>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">or</span>
        <div className="h-px flex-1 bg-gray-200"></div>
      </div>

      <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Login with Gmail
      </button>

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