import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import FolderPage from "./Pages/Dashboard/FolderPage.jsx";
import { DEFAULT_FOLDER } from "./config/folders";
import Responses from "./Pages/Responses/Responses.jsx";
import UrlShortener from "./Pages/UrlShortener/UrlShortener.jsx";

// 3. Form Builder & Preview Imports
import FormBuilder from "./Pages/FormBuilder/FormBuilder.jsx";
import PublicForm from "./Pages/PublicForm/PublicForm.jsx";
import AccountSettings from "./Pages/Settings/AccountSettings.jsx";
import PricingCheckout from "./Pages/Settings/Pricingcheckout.jsx";
import WorkspaceAdmin from "./Pages/Settings/Workspaceadmin.jsx";

const NotFound = () => (
  <div className="flex min-h-screen items-center justify-center text-3xl font-bold text-text">
    404 - Page Not Found
  </div>
);

const App = () => (
  <BrowserRouter>
    <Routes>
      {/* Authentication Routes wrapped in split-screen AuthLayout */}
      <Route element={<AuthLayout />}>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<OtpVerification />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Standalone Pricing Page */}
      <Route path="/pricing" element={<PricingCheckout />} />

      {/* Dashboard Routes that share the common Navbar layout */}
      <Route element={<Layout />}>
        {/* Dashboard = sidebar + <Outlet/>; each sidebar tab is a child route */}
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<Navigate to={`/dashboard/${DEFAULT_FOLDER}`} replace />} />
          <Route path=":folderSlug" element={<FolderPage />} />
        </Route>

        <Route path="/responses" element={<Responses />} />
        <Route path="/shortener" element={<UrlShortener />} />
        <Route path="/account-settings" element={<AccountSettings />} />
        <Route path="/admin" element={<WorkspaceAdmin />} />
      </Route>

      {/* Form Builder has its own distinct full-screen layout */}
      <Route path="/form-builder" element={<FormBuilder />} />
      <Route path="/form-builder/:formId" element={<FormBuilder />} />

      {/* Live Form Preview */}
      <Route path="/view" element={<PublicForm />} />

      {/* 404 Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;