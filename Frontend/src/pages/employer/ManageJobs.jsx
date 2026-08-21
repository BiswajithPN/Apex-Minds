import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ToggleLeft, ToggleRight, Trash2, Users, Edit3 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { CardSkeleton } from '../../components/ui/Spinner';
import api from '../../api/axiosInstance';

export default function ManageJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingJob, setEditingJob] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editType, setEditType] = useState('full-time');
  const [editSalary, setEditSalary] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const { data } = await api.get('/employer/jobs');
      setJobs(data.jobs || []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleJobStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';
    try {
      await api.put(`/employer/jobs/${id}`, { status: newStatus });
      setJobs(jobs.map((j) => (j._id === id ? { ...j, status: newStatus } : j)));
    } catch {
      // Handled by interceptor
    }
  };

  const deleteJob = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;
    try {
      await api.delete(`/employer/jobs/${id}`);
      setJobs(jobs.filter((j) => j._id !== id));
    } catch {
      // Handled by interceptor
    }
  };

  const openEditModal = (job) => {
    setEditingJob(job);
    setEditTitle(job.title || '');
    setEditLocation(job.location || '');
    setEditType(job.job_type || job.type || 'full-time');
    setEditSalary(job.salary || '');
    setEditSkills(Array.isArray(job.skills_required) ? job.skills_required.join(', ') : job.skills || '');
    setEditDescription(job.description || '');
    setModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingJob) return;
    setSubmittingEdit(true);

    try {
      const payload = {
        title: editTitle,
        location: editLocation,
        type: editType,
        salary: editSalary,
        skills: editSkills ? editSkills.split(',').map((s) => s.trim()).filter(Boolean) : [],
        description: editDescription,
      };

      const { data } = await api.put(`/employer/jobs/${editingJob._id}`, payload);
      const updated = data.job || data;

      setJobs(jobs.map((j) => (j._id === editingJob._id ? { ...j, ...updated } : j)));
      setModalOpen(false);
    } catch {
      // Handled by interceptor
    } finally {
      setSubmittingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <CardSkeleton lines={4} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Jobs</h1>
          <p className="text-sm text-slate-500 mt-1">View, edit, toggle status, or delete your job listings</p>
        </div>
        <Link to="/employer/post-job">
          <Button size="md">+ Post New Job</Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <Card padding="lg" className="text-center">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No jobs posted yet</p>
          <Link to="/employer/post-job">
            <Button size="sm" className="mt-3">Post Job</Button>
          </Link>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Applicants</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Posted Date</th>
                  <th className="text-right py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5 font-medium text-slate-900">
                      <Link to={`/employer/jobs/${job._id}/applicants`} className="hover:text-accent-600 transition-colors">
                        {job.title}
                      </Link>
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge variant={job.status === 'open' ? 'success' : 'neutral'} size="sm">
                        {job.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5">
                      <Link
                        to={`/employer/jobs/${job._id}/applicants`}
                        className="inline-flex items-center gap-1.5 text-accent-600 hover:text-accent-700 font-medium"
                      >
                        <Users className="w-4 h-4" />
                        {job.applicantCount || 0} applicants
                      </Link>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(job)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                          title="Edit job"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleJobStatus(job._id, job.status)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title={job.status === 'open' ? 'Close job' : 'Reopen job'}
                        >
                          {job.status === 'open' ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => deleteJob(job._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Edit Job Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Edit Job Posting"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title</label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Job Type</label>
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="full-time">Full-Time</option>
                <option value="part-time">Part-Time</option>
                <option value="contract">Contract</option>
                <option value="remote">Remote</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                placeholder="e.g. San Francisco, CA"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Salary Range</label>
              <input
                type="text"
                value={editSalary}
                onChange={(e) => setEditSalary(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                placeholder="e.g. $120k - $150k"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Required Skills (comma-separated)</label>
              <input
                type="text"
                value={editSkills}
                onChange={(e) => setEditSkills(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                placeholder="React, Node.js, TypeScript"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={4}
              required
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submittingEdit}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
