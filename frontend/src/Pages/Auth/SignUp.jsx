import { useState } from "react";
import { Link } from "react-router-dom";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = (e) => {
    e.preventDefault();
    console.log("Signing up with:", { name, email, password });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-10 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold">
          F
        </div>
        <span className="text-xl font-bold text-text">FormHub</span>
      </div>

      <h2 className="mb-8 text-2xl font-bold text-text">Create an account</h2>

      <form onSubmit={handleSignUp} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-text">Full Name</label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-border bg-background p-3.5 text-sm outline-none transition focus:border-primary"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-text">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-background p-3.5 text-sm outline-none transition focus:border-primary"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-text">Password</label>
          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border bg-background p-3.5 text-sm outline-none transition focus:border-primary"
            required
          />
        </div>

        <button
          type="submit"
          className="mt-2 w-full rounded-xl bg-primary py-3.5 text-sm font-medium text-white transition hover:bg-primary-hover shadow-sm"
        >
          Sign Up
        </button>
      </form>

      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-border"></div>
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">or</span>
        <div className="h-px flex-1 bg-border"></div>
      </div>

      <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-white py-3.5 text-sm font-medium text-text transition hover:bg-background">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Sign up with Gmail
      </button>

      <p className="mt-8 text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
};

export default SignUp;