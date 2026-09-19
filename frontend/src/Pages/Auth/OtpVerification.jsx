import { useState } from "react";
import { useNavigate } from "react-router-dom";

const OtpVerification = () => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const navigate = useNavigate();

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    if (element.nextSibling && element.value !== "") {
      element.nextSibling.focus();
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    navigate("/reset-password");
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <h2 className="mb-10 text-2xl font-bold text-gray-900 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">F</span>
        FormHub
      </h2>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h3>
      <p className="mb-8 text-sm text-gray-500">
        Enter the OTP sent to your mail.
      </p>

      <form onSubmit={handleVerify} className="space-y-8">
        <div className="flex justify-between gap-4">
          {otp.map((data, index) => (
            <input
              className="h-14 w-14 rounded-xl border border-gray-200 bg-gray-50 text-center text-xl font-bold text-gray-900 outline-none transition focus:border-blue-600 focus:bg-white"
              type="text"
              maxLength="1"
              key={index}
              value={data}
              onChange={(e) => handleChange(e.target, index)}
              onFocus={(e) => e.target.select()}
            />
          ))}
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-medium text-white transition hover:bg-blue-700 shadow-sm"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default OtpVerification;