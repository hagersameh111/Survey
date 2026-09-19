import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* This simple wrapper allows each child page to define its own internal layout */}
      <div className="p-6">
        <Outlet /> 
      </div>
    </div>
  );
};

export default Layout;