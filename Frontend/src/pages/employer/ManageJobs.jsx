import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ToggleLeft, ToggleRight, Trash2, Users, PlusCircle, Sparkles, MapPin, DollarSign, ArrowRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { CardSkeleton } from '../../components/ui/Spinner';
import api from '../../api/axiosInstance';

export default function ManageJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      let res;
      try {
        res = await api.get('/employer/jobs');
      } catch {
        res = await api.get('/jobs/employer/mine');
      }
      setJobs(res.data.jobs || res.data.data || []);
    } catch (err) {
      console.error('Failed to load employer jobs', err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleJobStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';
    try {
      try {
        await api.put(`/employer/jobs/${id}`, { status: newStatus });
      } catch {
        await api.patch(`/jobs/${id}`, { status: newStatus });
      }
      setJobs(jobs.map((j) => (j._id === id ? { ...j, status: newStatus } : j)));
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const deleteJob = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job posting? All submitted applications will also be removed.')) return;
    try {
      try {
        await api.delete(`/employer/jobs/${id}`);
      } catch {
        await api.delete(`/jobs/${id}`);
      }
      setJobs(jobs.filter((j) => j._id !== id));
    } catch (err) {
      console.error('Failed to delete job', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in w-full pb-16">
        <CardSkeleton lines={5} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 w-full pb-20 font-sans text-slate-800">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Manage Job Postings</h1>
          <p className="text-xs sm:text-base text-slate-500 mt-1 font-medium">
            View active listings, track candidate applications, toggle status, and run AI multi-criteria screening
          </p>
        </div>
        <Link to="/employer/post-job">
          <Button size="md" className="shadow-md shadow-accent-500/20 font-bold text-xs sm:text-sm w-full sm:w-auto">
            <PlusCircle className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <Card padding="md" className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-accent-50 text-accent-500 flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-1">No jobs posted yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-5 font-medium leading-relaxed">
            Post your first job listing to start receiving candidate applications, automated multi-criteria ranking, and AI resume screening.
          </p>
          <Link to="/employer/post-job">
            <Button size="md" className="font-bold text-xs sm:text-sm">
              <PlusCircle className="w-4 h-4 mr-2" />
              Post Your First Job
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {jobs.map((job) => (
            <Card key={job._id} padding="md" className="hover:border-accent-300 transition-all shadow-sm bg-white border-2 border-slate-200/80">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Link
                      to={`/employer/jobs/${job._id}/applicants`}
                      className="text-lg sm:text-2xl font-black text-slate-900 hover:text-accent-600 transition-colors"
                    >
                      {job.title}
                    </Link>
                    <Badge variant={job.status === 'open' ? 'success' : 'neutral'} size="sm">
                      {job.status === 'open' ? 'Active / Open' : 'Closed'}
                    </Badge>
                    {job.job_type && (
                      <span className="text-[11px] sm:text-xs font-bold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-lg border border-slate-200 uppercase tracking-wider">
                        {job.job_type}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs sm:text-sm text-slate-500 font-medium">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {job.location}
                      </span>
                    )}
                    {job.salary && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        {job.salary}
                      </span>
                    )}
                    <span>Posted on {new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Required Skills list */}
                  {job.skills_required?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Skills:</span>
                      {job.skills_required.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 bg-accent-50 text-accent-700 border border-accent-200 text-[11px] font-bold rounded-lg"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <Link to={`/employer/jobs/${job._id}/applicants`} className="flex-1 sm:flex-initial">
                    <Button variant="secondary" size="sm" className="font-extrabold text-xs shadow-2xs w-full">
                      <Users className="w-3.5 h-3.5 mr-1.5 text-accent-600" />
                      Applicants ({job.applicantCount || 0})
                    </Button>
                  </Link>

                  <Link to={`/employer/jobs/${job._id}/applicants`} className="flex-1 sm:flex-initial">
                    <Button size="sm" className="font-extrabold text-xs shadow-xs flex items-center justify-center gap-1.5 w-full">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Screen
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>

                  <button
                    onClick={() => toggleJobStatus(job._id, job.status)}
                    title={job.status === 'open' ? 'Deactivate job' : 'Activate job'}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                  >
                    {job.status === 'open' ? (
                      <ToggleRight className="w-5 h-5 text-success-600" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  <button
                    onClick={() => deleteJob(job._id)}
                    title="Delete job post"
                    className="p-2 rounded-xl border border-danger-200 hover:bg-danger-50 text-danger-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
