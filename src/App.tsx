import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import PrivateRoute from "@/components/PrivateRoute";
import PublicRoute from "@/components/PublicRoute";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Home = lazy(() => import("./pages/Home"));
const Products = lazy(() => import("./pages/Products"));
const MyProducts = lazy(() => import("./pages/MyProducts"));
const Team = lazy(() => import("./pages/Team"));
const Profile = lazy(() => import("./pages/Profile"));
const AccountDetails = lazy(() => import("./pages/AccountDetails"));
const Deposit = lazy(() => import("./pages/Deposit"));
const Withdraw = lazy(() => import("./pages/Withdraw"));
const History = lazy(() => import("./pages/History"));
const WithdrawalsHistory = lazy(() => import("./pages/WithdrawalsHistory"));
const About = lazy(() => import("./pages/About"));
const Rules = lazy(() => import("./pages/Rules"));
const Support = lazy(() => import("./pages/Support"));
const BankAccount = lazy(() => import("./pages/BankAccount"));

const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminUserProducts = lazy(() => import("./pages/admin/AdminUserProducts"));
const AdminDeposits = lazy(() => import("./pages/admin/AdminDeposits"));
const AdminWithdrawals = lazy(() => import("./pages/admin/AdminWithdrawals"));
const AdminReferrals = lazy(() => import("./pages/admin/AdminReferrals"));
const AdminPromoters = lazy(() => import("./pages/admin/AdminPromoters"));

const queryClient = new QueryClient();

const Loading = () => (
  <div className="app-shell flex items-center justify-center min-h-screen">
    <div className="w-9 h-9 border-[3px] border-muted border-t-primary rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route
                path="/"
                element={
                  <PublicRoute>
                    <Navigate to="/login" replace />
                  </PublicRoute>
                }
              />
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />

              <Route
                path="/home"
                element={
                  <PrivateRoute>
                    <Home />
                  </PrivateRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <PrivateRoute>
                    <Products />
                  </PrivateRoute>
                }
              />
              <Route
                path="/my-products"
                element={
                  <PrivateRoute>
                    <MyProducts />
                  </PrivateRoute>
                }
              />
              <Route
                path="/team"
                element={
                  <PrivateRoute>
                    <Team />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/account"
                element={
                  <PrivateRoute>
                    <AccountDetails />
                  </PrivateRoute>
                }
              />
              <Route
                path="/deposit"
                element={
                  <PrivateRoute>
                    <Deposit />
                  </PrivateRoute>
                }
              />
              <Route
                path="/withdraw"
                element={
                  <PrivateRoute>
                    <Withdraw />
                  </PrivateRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <PrivateRoute>
                    <History />
                  </PrivateRoute>
                }
              />
              <Route
                path="/withdrawals"
                element={
                  <PrivateRoute>
                    <WithdrawalsHistory />
                  </PrivateRoute>
                }
              />
              <Route
                path="/about"
                element={
                  <PrivateRoute>
                    <About />
                  </PrivateRoute>
                }
              />
              <Route
                path="/rules"
                element={
                  <PrivateRoute>
                    <Rules />
                  </PrivateRoute>
                }
              />
              <Route
                path="/support"
                element={
                  <PrivateRoute>
                    <Support />
                  </PrivateRoute>
                }
              />
              <Route
                path="/bank"
                element={
                  <PrivateRoute>
                    <BankAccount />
                  </PrivateRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <PrivateRoute>
                    <AdminLayout />
                  </PrivateRoute>
                }
              >
                <Route index element={<Navigate to="users" replace />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="user-products" element={<AdminUserProducts />} />
                <Route path="deposits" element={<AdminDeposits />} />
                <Route path="withdrawals" element={<AdminWithdrawals />} />
                <Route path="referrals" element={<AdminReferrals />} />
                <Route path="promoters" element={<AdminPromoters />} />
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
