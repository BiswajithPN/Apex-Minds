import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';

// Auth pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ChangePassword from '../pages/auth/ChangePassword';

// Job Seeker pages
import JSKDashboard from '../pages/jobseeker/Dashboard';
import ProfileEdit from '../pages/jobseeker/ProfileEdit';
import ResumeUpload from '../pages/jobseeker/ResumeUpload';
import JobSearch from '../pages/jobseeker/JobSearch';
import JobDetails from '../pages/jobseeker/JobDetails';
import MyApplications from '../pages/jobseeker/MyApplications';
import Recommendations from '../pages/jobseeker/Recommendations';

// Employer pages
import EmpDashboard from '../pages/employer/Dashboard';
import CompanyProfile from '../pages/employer/CompanyProfile';
import PostJob from '../pages/employer/PostJob';
import ManageJobs from '../pages/employer/ManageJobs';
import Applicants from '../pages/employer/Applicants';
import CandidateProfile from '../pages/employer/CandidateProfile';
import CandidateAnalysis from '../pages/employer/CandidateAnalysis';

// Admin pages
import AdminDashboard from '../pages/admin/Dashboard';
import UserManagement from '../pages/admin/UserManagement';
import FlaggedPostings from '../pages/admin/FlaggedPostings';
import Analytics from '../pages/admin/Analytics';

// Misc
import NotFound from '../pages/NotFound';

export default function AppRoutes() {
  return (
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
  );
}
