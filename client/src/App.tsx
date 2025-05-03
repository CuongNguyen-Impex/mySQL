import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AppShell from "./components/layout/app-shell";
import Dashboard from "./pages/dashboard";
import Bills from "./pages/bills";
import BillDetails from "./pages/bills/bill-details";
import Reports from "./pages/reports";
import ReportsByCustomer from "./pages/reports/by-customer";
import ReportsBySupplier from "./pages/reports/by-supplier";
import ReportsProfitLoss from "./pages/reports/profit-loss";
import BillDetailReport from "./pages/reports/bill-detail-new";
import Settings from "./pages/settings";
import SettingsCategories from "./pages/settings/categories";
import SettingsGoogleSheets from "./pages/settings/google-sheets";
import SettingsUsers from "./pages/settings/users";
import CostTypeAttributes from "./pages/settings/cost-type-attributes";
import Customers from "./pages/customers";
import Suppliers from "./pages/suppliers";
import Pricing from "./pages/pricing";
import AuthPage from "./pages/auth";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/bills" component={Bills} />
      <ProtectedRoute path="/bills/:id" component={BillDetails} />
      <ProtectedRoute path="/reports" component={Reports} />
      <ProtectedRoute path="/reports/by-customer" component={ReportsByCustomer} />
      <ProtectedRoute path="/reports/by-supplier" component={ReportsBySupplier} />
      <ProtectedRoute path="/reports/profit-loss" component={ReportsProfitLoss} />
      <ProtectedRoute path="/reports/bill-detail" component={BillDetailReport} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/settings/categories" component={SettingsCategories} />
      <ProtectedRoute path="/settings/google-sheets" component={SettingsGoogleSheets} />
      <ProtectedRoute path="/settings/users" component={SettingsUsers} />
      <ProtectedRoute path="/settings/cost-type-attributes" component={CostTypeAttributes} />
      <ProtectedRoute path="/customers" component={Customers} />
      <ProtectedRoute path="/suppliers" component={Suppliers} />
      <ProtectedRoute path="/pricing" component={Pricing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppShell>
          <Router />
        </AppShell>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
