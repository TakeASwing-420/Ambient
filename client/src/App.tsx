import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Convert from "@/pages/Convert";
import Dashboard from "@/pages/Dashboard";
import About from "@/pages/About";
import Signin from "@/pages/Signin";
import Login from "@/pages/login";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import Community from "./pages/Community.jsx";
import Profile from "./pages/Profile.jsx";

const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="w-screen h-screen flex justify-center items-center">Loading...</div>;
  }
  if (!user) {
    window.location.href = "/login";
    return null;
  }
  return children;
};

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/convert">
        <AuthProvider>
          <RequireAuth>
            <Convert />
          </RequireAuth>
        </AuthProvider>
      </Route>
      <Route path="/dashboard">
        <AuthProvider>
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        </AuthProvider>
      </Route>
      <Route path="/community" component={Community} />
      <Route path="/profile" component={Profile} />
      <Route path="/signin" component={Signin} />
      <Route path="/login" component={Login} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
