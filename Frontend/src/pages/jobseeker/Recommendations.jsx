import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Briefcase, User, FileText, ArrowRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { CardSkeleton } from '../../components/ui/Spinner';
import api from '../../api/axiosInstance';

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const { data } = await api.get('/recommendations');
      setRecommendations(data.recommendations || []);
      setHasProfile(data.hasProfile !== false);
    } catch {
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <CardSkeleton lines={2} />
        {[1, 2, 3].map((i) => <CardSkeleton key={i} lines={3} />)}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-6 h-6 text-accent-500" />
          <h1 className="text-2xl font-bold text-slate-900">AI Recommendations</h1>
        </div>
        <p className="text-sm text-slate-500">
          Jobs matched to your profile and skills using AI
        </p>
      </div>

      {/* Empty state */}
      {recommendations.length === 0 ? (
        <Card padding="lg" className="text-center">
          <Sparkles className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-700">No recommendations yet</p>
          <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
            {!hasProfile
              ? 'Complete your profile and upload a resume to get AI-powered job recommendations.'
              : 'We\'re still matching jobs for you. Check back soon!'}
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <Link to="/jobseeker/profile">
              <Button variant="secondary" size="sm">
                <User className="w-4 h-4" />
                Complete Profile
              </Button>
            </Link>
            <Link to="/jobseeker/resume">
              <Button size="sm">
                <FileText className="w-4 h-4" />
                Upload Resume
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <Link key={rec._id || index} to={`/jobseeker/jobs/${rec._id}`}>
              <Card hover padding="md" className="group">
                <div className="flex items-start gap-4">
                  {/* Logo + Rank Badge */}
                  <div className="relative w-12 h-12 rounded-2xl bg-white border border-slate-200/90 p-1.5 flex items-center justify-center shrink-0 shadow-xs">
                    <img
                      src="/Hirehub-logo.png"
                      alt="HireHub"
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent-600 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900 group-hover:text-accent-600 transition-colors">
                            {rec.title}
                          </h3>
                          {rec.matchScore && (
                            <Badge
                              variant={rec.matchScore >= 75 ? 'success' : rec.matchScore >= 50 ? 'accent' : 'neutral'}
                              size="sm"
                              className="font-black text-[11px]"
                            >
                              {rec.matchScore}% Match
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 font-semibold mt-0.5">
                          {rec.company || rec.employerId?.full_name || rec.company?.name || 'Company'}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {rec.location || 'Remote'}
                      </span>
                      <Badge variant="accent" size="sm">
                        <Briefcase className="w-3 h-3" />
                        {rec.job_type || rec.type || 'Full-time'}
                      </Badge>
                      {rec.salary && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                          {rec.salary}
                        </span>
                      )}
                    </div>

                    {/* Matched skills */}
                    {rec.matchedSkills?.length > 0 && (
                      <div className="mt-3">
                        <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1">
                          Matching Skills
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {rec.matchedSkills.map((skill) => (
                            <Badge key={skill} variant="success" size="sm">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reasons */}
                    {rec.reasons?.length > 0 && (
                      <div className="mt-2.5">
                        <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1">
                          Why It Fits
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {rec.reasons.map((reason, i) => (
                            <div key={i} className="text-xs text-slate-600 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/70 font-medium">
                              ✨ {reason}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
