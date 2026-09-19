import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleReset = (e) => {
    e.preventDefault();
    navigate("/login");
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <h2 className="mb-10 text-2xl font-bold text-gray-900 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">F</span>
        FormHub
      </h2>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h3>
      <p className="mb-8 text-sm text-gray-500">Choose a new password.</p>

      <form onSubmit={handleReset} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-sm outline-none transition focus:border-blue-600 focus:bg-white"
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
          <p className="mb-3 font-semibold text-gray-900">Password must have:</p>
          <ul className="space-y-2 text-gray-500">
            <li>• Must contain at least 8 characters.</li>
            <li>• Must contain at least 1 uppercase letter.</li>
            <li>• Must contain at least 1 lowercase letter.</li>
            <li>• Must contain at least 1 digit (0-9).</li>
            <li>• No spaces allowed.</li>
          </ul>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-sm outline-none transition focus:border-blue-600 focus:bg-white"
          />
        </div>

        <button
          type="submit"
          className="mt-4 w-full rounded-xl bg-blue-600 py-3.5 text-sm font-medium text-white transition hover:bg-blue-700 shadow-sm"
        >
          Confirm
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;