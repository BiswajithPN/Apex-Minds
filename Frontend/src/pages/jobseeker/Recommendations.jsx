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
                  {/* Rank */}
                  <div className="w-11 h-11 rounded-xl gradient-accent flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md shadow-accent-500/20">
                    #{index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-accent-600 transition-colors">
                          {rec.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {rec.company?.name || rec.employer?.name}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all shrink-0 mt-0.5" />
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" />
                        {rec.location || 'Remote'}
                      </span>
                      <Badge variant="accent" size="sm">
                        <Briefcase className="w-3 h-3" />
                        {rec.type || 'full-time'}
                      </Badge>
                    </div>

                    {/* Matched skills */}
                    {rec.matchedSkills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {rec.matchedSkills.map((skill) => (
                          <Badge key={skill} variant="success" size="sm">{skill}</Badge>
                        ))}
                      </div>
                    )}

                    {/* Reasons */}
                    {rec.reasons?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {rec.reasons.map((reason, i) => (
                          <Badge key={i} variant="neutral" size="sm">{reason}</Badge>
                        ))}
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
