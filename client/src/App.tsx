import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ProtectedLayout from './pages/ProtectedLayout';
import RoundPage from './pages/RoundPage';
import StudentsPage from './pages/StudentsPage';
import FinalScoresPage from './pages/FinalScoresPage';
import { AuthProvider } from './context/AuthContext';
import DashboardHome from './pages/DashboardHome';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app" element={<ProtectedLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="round-1" element={<RoundPage round={1} />} />
          <Route path="round-2" element={<RoundPage round={2} />} />
          <Route path="round-3" element={<RoundPage round={3} />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="final-scores" element={<FinalScoresPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
