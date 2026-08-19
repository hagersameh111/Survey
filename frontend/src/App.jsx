import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Layout from "./components/layout/Layout";
import Dashboard from "./Pages/Dashboard/Dashboard.jsx";
import FormBuilder from "./Pages/FormBuilder/FormBuilder.jsx";
import Responses from "./Pages/Responses/Responses.jsx";
import UrlShortener from "./Pages/UrlShortener/UrlShortener.jsx";
import BuilderContent from "./Pages/FormBuilder/Components/BuilderContent.jsx"; 
import WelcomePage from "./Pages/FormBuilder/pages/WelcomePage.jsx";
import PublicForm from "./Pages/PublicForm/PublicForm.jsx";

const NotFound = () => (
  <div className="flex min-h-screen items-center justify-center text-3xl font-bold text-text">
    404 - Page Not Found
  </div>
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Routes that share the common Navbar layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/responses" element={<Responses />} />
          <Route path="/shortener" element={<UrlShortener />} />
        </Route>

        {/* Form Builder has its own distinct full-screen layout */}
        <Route path="/form-builder" element={<FormBuilder />} />
        <Route path="/builder-content" element={<BuilderContent />} />
        <Route path="/welcome" element={<WelcomePage />} />
<Route path="/view" element={<PublicForm />} />
        {/* 404 Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);