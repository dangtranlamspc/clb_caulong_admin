import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/auth.store';
import AdminLayout from './components/layout/AdminLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import MembersPage from './pages/members/MembersPage';
import MemberFormPage from './pages/members/MemberFormPage';
import SessionsPage from './pages/sessions/SessionsPage';
import SessionFormPage from './pages/sessions/SessionFormPage';
import SessionDetailPage from './pages/sessions/SessionDetailPage';
import RegistrationsPage from './pages/registrations/RegistrationsPage';
import LeaderboardPage from './pages/leaderboard/LeaderboardPage';
import MatchesAdminPage from './pages/matches/MatchesAdminPage';
import WinRateLeaderboardPage from './pages/rankings/WinRateLeaderboardPage';
import SessionFinishPage from './pages/sessions/SessionFinishPage';
import WalletAdminSummaryPage from './pages/wallets/WalletAdminSummaryPage';
import WalletAdminDepositePage from './pages/wallets/WalletAdminDepositePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AdminLayout>{children}</AdminLayout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

        <Route path="/members" element={<ProtectedRoute><MembersPage /></ProtectedRoute>} />
        <Route path="/members/create" element={<ProtectedRoute><MemberFormPage /></ProtectedRoute>} />
        <Route path="/members/:id" element={<ProtectedRoute><MemberFormPage /></ProtectedRoute>} />

        <Route path="/sessions" element={<ProtectedRoute><SessionsPage /></ProtectedRoute>} />
        <Route path="/sessions/create" element={<ProtectedRoute><SessionFormPage /></ProtectedRoute>} />
        <Route path="/sessions/:id" element={<ProtectedRoute><SessionDetailPage /></ProtectedRoute>} />
        <Route path="/sessions/:id/edit" element={<ProtectedRoute><SessionFormPage /></ProtectedRoute>} />

        <Route path="/registrations" element={<ProtectedRoute><RegistrationsPage /></ProtectedRoute>} />

        <Route path="/matches" element={<ProtectedRoute><MatchesAdminPage /></ProtectedRoute>} />

        <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />

        <Route path="/rankings/win-rate" element={<ProtectedRoute><WinRateLeaderboardPage /></ProtectedRoute>} />

        <Route path='/sessions/:id/finish' element={<ProtectedRoute><SessionFinishPage /></ProtectedRoute>} />

        <Route path='/wallets/deposits' element={<ProtectedRoute><WalletAdminDepositePage /></ProtectedRoute>} />

        <Route path='/wallets/summary' element={<ProtectedRoute><WalletAdminSummaryPage /></ProtectedRoute>} />



        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}