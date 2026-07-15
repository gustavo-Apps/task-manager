import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute    from "./components/PrivateRoute";
import Layout          from "./components/Layout";

import LoginPage        from "./pages/LoginPage";
import DashboardPage    from "./pages/DashboardPage";
import PendingTasksPage from "./pages/PendingTasksPage";
import TaskFormPage     from "./pages/TaskFormPage";
import ReportsPage      from "./pages/ReportsPage";
import ReportDetailPage from "./pages/ReportDetailPage";
import TicketsPage      from "./pages/TicketsPage";
import SettingsPage     from "./pages/SettingsPage";
import ProfilePage      from "./pages/ProfilePage";
import AdminPage        from "./pages/AdminPage";
import ManagerDashboardPage     from "./pages/ManagerDashboardPage";
import ManagerEmployeesPage     from "./pages/ManagerEmployeesPage";
import ManagerEmployeeDetailPage from "./pages/ManagerEmployeeDetailPage";
import ManagerActivitiesPage    from "./pages/ManagerActivitiesPage";
import ManagerStatisticsPage    from "./pages/ManagerStatisticsPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1f2937",
              color: "#f3f4f6",
              border: "1px solid #374151",
              fontSize: "13px",
            },
          }}
        />

        <Routes>
          {/* Pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Autenticadas — todas passam pelo Layout */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout><DashboardPage /></Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/pending"
            element={
              <PrivateRoute>
                <Layout><PendingTasksPage /></Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <PrivateRoute>
                <Layout><TaskFormPage /></Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks/new"
            element={
              <PrivateRoute>
                <Layout><TaskFormPage /></Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks/:id/edit"
            element={
              <PrivateRoute>
                <Layout><TaskFormPage /></Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PrivateRoute>
                <Layout><ReportsPage /></Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/reports/:id"
            element={
              <PrivateRoute>
                <Layout><ReportDetailPage /></Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/tickets"
            element={
              <PrivateRoute>
                <Layout><TicketsPage /></Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Layout><SettingsPage /></Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Layout><ProfilePage /></Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute requiredRole="admin">
                <Layout><AdminPage /></Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/manager"
            element={
              <PrivateRoute requiredRole={["manager", "admin"]}>
                <Layout><ManagerDashboardPage /></Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/manager/employees"
            element={
              <PrivateRoute requiredRole={["manager", "admin"]}>
                <Layout><ManagerEmployeesPage /></Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/manager/employees/:id"
            element={
              <PrivateRoute requiredRole={["manager", "admin"]}>
                <Layout><ManagerEmployeeDetailPage /></Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/manager/activities"
            element={
              <PrivateRoute requiredRole={["manager", "admin"]}>
                <Layout><ManagerActivitiesPage /></Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/manager/statistics"
            element={
              <PrivateRoute requiredRole={["manager", "admin"]}>
                <Layout><ManagerStatisticsPage /></Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
