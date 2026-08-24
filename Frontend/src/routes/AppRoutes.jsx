import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';

// ── Eagerly loaded (tiny, always needed on first visit) ──
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import NotFound from '../pages/NotFound';

// ── Lazy loaded (only downloaded when the user navigates there) ──
const ChangePassword   = lazy(() => import('../pages/auth/ChangePassword'));

// Job Seeker
const JSKDashboard     = lazy(() => import('../pages/jobseeker/Dashboard'));
const ProfileEdit      = lazy(() => import('../pages/jobseeker/ProfileEdit'));
const ResumeUpload     = lazy(() => import('../pages/jobseeker/ResumeUpload'));
const JobSearch        = lazy(() => import('../pages/jobseeker/JobSearch'));
const JobDetails       = lazy(() => import('../pages/jobseeker/JobDetails'));
const MyApplications   = lazy(() => import('../pages/jobseeker/MyApplications'));
const Recommendations  = lazy(() => import('../pages/jobseeker/Recommendations'));

// Employer
const EmpDashboard     = lazy(() => import('../pages/employer/Dashboard'));
const CompanyProfile   = lazy(() => import('../pages/employer/CompanyProfile'));
const PostJob          = lazy(() => import('../pages/employer/PostJob'));
const ManageJobs       = lazy(() => import('../pages/employer/ManageJobs'));
const Applicants       = lazy(() => import('../pages/employer/Applicants'));
const CandidateProfile = lazy(() => import('../pages/employer/CandidateProfile'));
const CandidateAnalysis = lazy(() => import('../pages/employer/CandidateAnalysis'));

// Admin
const AdminDashboard   = lazy(() => import('../pages/admin/Dashboard'));
const UserManagement   = lazy(() => import('../pages/admin/UserManagement'));
const FlaggedPostings  = lazy(() => import('../pages/admin/FlaggedPostings'));
const Analytics        = lazy(() => import('../pages/admin/Analytics'));

// Loading spinner shown while chunks are downloading
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-semibold">Loading…</p>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected — all roles */}
        <Route
          path="/change-password"
          element={
            <ProtectedRoute allowedRoles={['jobseeker', 'employer', 'admin']}>
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        {/* Job Seeker */}
        <Route
          path="/jobseeker"
          element={
            <ProtectedRoute allowedRoles={['jobseeker']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<JSKDashboard />} />
          <Route path="profile" element={<ProfileEdit />} />
          <Route path="resume" element={<ResumeUpload />} />
          <Route path="jobs" element={<JobSearch />} />
          <Route path="jobs/:id" element={<JobDetails />} />
          <Route path="applications" element={<MyApplications />} />
          <Route path="applications/:applicationId/analysis" element={<CandidateAnalysis />} />
          <Route path="recommendations" element={<Recommendations />} />
        </Route>

        {/* Employer */}
        <Route
          path="/employer"
          element={
            <ProtectedRoute allowedRoles={['employer']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<EmpDashboard />} />
          <Route path="company" element={<CompanyProfile />} />
          <Route path="post-job" element={<PostJob />} />
          <Route path="jobs" element={<ManageJobs />} />
          <Route path="jobs/:id/applicants" element={<Applicants />} />
          <Route path="jobs/:jobId/applicants/:applicationId/analysis" element={<CandidateAnalysis />} />
          <Route path="applications/:applicationId/analysis" element={<CandidateAnalysis />} />
          <Route path="candidates/:id" element={<CandidateProfile />} />
        </Route>

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="flagged" element={<FlaggedPostings />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
