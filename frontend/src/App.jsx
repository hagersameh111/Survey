import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

// 1. Auth & Layout Imports
import AuthLayout from "./Pages/Auth/AuthLayout.jsx"; 
import Login from "./Pages/Auth/Login.jsx";
import SignUp from "./Pages/Auth/SignUp.jsx";
import ForgotPassword from "./Pages/Auth/ForgotPassword.jsx";
import OtpVerification from "./Pages/Auth/OtpVerification.jsx";
import ResetPassword from "./Pages/Auth/ResetPassword.jsx"; 
import Pricing from "./Pages/Auth/Pricing.jsx";

// 2. Dashboard & Shared Layout Imports
import Layout from "./components/layout/Layout";
import Dashboard from "./Pages/Dashboard/Dashboard.jsx";
import Responses from "./Pages/Responses/Responses.jsx";
import UrlShortener from "./Pages/UrlShortener/UrlShortener.jsx";

// 3. Form Builder & Preview Imports
import FormBuilder from "./Pages/FormBuilder/FormBuilder.jsx";
import PublicForm from "./Pages/PublicForm/PublicForm.jsx";
import AccountSettings from "./Pages/Settings/AccountSettings.jsx";
import PricingCheckout from "./Pages/Settings/Pricingcheckout.jsx";

const NotFound = () => (
  <div className="flex min-h-screen items-center justify-center text-3xl font-bold text-text">
    404 - Page Not Found
  </div>
);

// 4. Render App
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        
        {/* Authentication Routes wrapped in split-screen AuthLayout */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<OtpVerification />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>
        
        {/* Standalone Pricing Page */}
       
        <Route path="/pricing" element={<PricingCheckout />} />

        {/* Dashboard Routes that share the common Navbar & Sidebar layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/responses" element={<Responses />} />
          <Route path="/shortener" element={<UrlShortener />} />
          <Route path="/account-settings" element={<AccountSettings />} />

        </Route>

        {/* Form Builder has its own distinct full-screen layout */}
        <Route path="/form-builder" element={<FormBuilder />} />
        
        {/* Live Form Preview */}
        <Route path="/view" element={<PublicForm />} />
        
        {/* 404 Catch-all */}
        <Route path="*" element={<NotFound />} />
        
      </Routes>
    </BrowserRouter>
  </StrictMode>
);