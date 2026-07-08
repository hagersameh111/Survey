import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";

import DashboardHeader from "./components/DashboardHeader";
import WorkspaceEmpty from "./components/WorkspaceEmpty";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex gap-6 p-4">
        {/* Sidebar */}
        <Sidebar />

        {/* Dashboard */}
        <main className="flex-1 rounded-2xl bg-surface p-8 shadow-sm">
          <DashboardHeader />

          <WorkspaceEmpty />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;