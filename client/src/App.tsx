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
import CostTypeAttributes from "./pages/settings/cost-type-attributes";
import Customers from "./pages/customers";
import Suppliers from "./pages/suppliers";
import Pricing from "./pages/pricing";
import AuthPage from "./pages/auth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/login" component={AuthPage} />
      <Route path="/bills" component={Bills} />
      <Route path="/bills/:id" component={BillDetails} />
      <Route path="/reports" component={Reports} />
      <Route path="/reports/by-customer" component={ReportsByCustomer} />
      <Route path="/reports/by-supplier" component={ReportsBySupplier} />
      <Route path="/reports/profit-loss" component={ReportsProfitLoss} />
      <Route path="/reports/bill-detail" component={BillDetailReport} />
      <Route path="/settings" component={Settings} />
      <Route path="/settings/categories" component={SettingsCategories} />
      <Route path="/settings/google-sheets" component={SettingsGoogleSheets} />
      <Route path="/settings/cost-type-attributes" component={CostTypeAttributes} />
      <Route path="/customers" component={Customers} />
      <Route path="/suppliers" component={Suppliers} />
      <Route path="/pricing" component={Pricing} />
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
