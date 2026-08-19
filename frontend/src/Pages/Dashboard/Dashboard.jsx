import Sidebar from "../../components/layout/Sidebar";
import DashboardHeader from "./components/DashboardHeader";
import WorkspaceEmpty from "./components/WorkspaceEmpty";

const Dashboard = () => {
  return (
    <div className="flex gap-6">
      {/* The Sidebar is now strictly locked to the Dashboard */}
      <Sidebar />
      
      <main className="flex-1 rounded-2xl bg-surface p-8 shadow-sm">
        <DashboardHeader />
        <WorkspaceEmpty />
      </main>
    </div>
  );
};

export default Dashboard;