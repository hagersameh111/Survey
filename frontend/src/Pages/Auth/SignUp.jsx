import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../../api/auth";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    // Split full name into firstName and lastName to match backend Zod schema
    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : firstName;

    try {
      await register({ firstName, lastName, email, password });

      // Navigate to login on success
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Signup failed");
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-10 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-white">F</div>
        <span className="text-xl font-bold text-text">FormHub</span>
      </div>

      <h2 className="mb-2 text-2xl font-bold text-text">Create an account</h2>

      {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSignUp} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-text">Full Name</label>
          <input
            type="text"
            placeholder="John Doe"
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
            placeholder="you@example.com"
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
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border bg-background p-3.5 text-sm outline-none transition focus:border-primary"
            minLength={6}
            required
          />
        </div>
        <button type="submit" className="w-full rounded-xl bg-primary py-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-hover">
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default SignUp;
