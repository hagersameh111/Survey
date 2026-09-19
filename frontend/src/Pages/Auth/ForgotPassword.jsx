import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSend = (e) => {
    e.preventDefault();
    navigate("/verify-otp");
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <h2 className="mb-2 text-3xl font-bold text-text flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white text-sm">F</span>
        FormHub
      </h2>
      <h3 className="text-2xl font-bold text-text mb-2">Reset Password</h3>
      <p className="mb-8 text-sm text-text-secondary">
        Enter your email address to send you OTP
      </p>

      <form onSubmit={handleSend} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-text">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-background p-3.5 text-sm outline-none transition focus:border-primary"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-primary py-3.5 text-sm font-medium text-white transition hover:bg-primary-hover shadow-sm"
        >
          Send
        </button>
      </form>
      
      <div className="mt-8 text-center">
        <Link to="/login" className="text-sm font-medium text-primary hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;