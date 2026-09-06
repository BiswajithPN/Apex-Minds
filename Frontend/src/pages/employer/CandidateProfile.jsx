import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MapPin, ExternalLink, FileText, Award } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Spinner';
import api from '../../api/axiosInstance';
import { getStorageUrl } from '../../utils/url';

export default function CandidateProfile() {
  const { id: candidateId } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCandidate();
  }, [candidateId]);

  const loadCandidate = async () => {
    try {
      const { data } = await api.get(`/users/${candidateId}`);
      setCandidate(data?.user ?? data);
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  if (!candidate) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Candidate profile not found</p>
        <Button variant="secondary" size="sm" onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const profile = candidate.profile || candidate;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-accent-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Applicants
      </button>

      {/* Header */}
      <Card padding="md" className="mb-6 border-2 border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl gradient-accent flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-md">
            {candidate.avatar ? (
              <img src={candidate.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
            ) : (
              (candidate.name || candidate.full_name || 'C')[0].toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">{candidate.name || candidate.full_name}</h1>
            <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-slate-500 font-medium">
              {candidate.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {candidate.email}
                </span>
              )}
              {profile.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {profile.phone}
                </span>
              )}
              {profile.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {profile.location}
                </span>
              )}
            </div>
          </div>

          {(candidate.resumeUrl || profile.resume_url || candidate.resume_url) && (
            <a
              href={getStorageUrl(candidate.resumeUrl || profile.resume_url || candidate.resume_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 w-full sm:w-auto"
            >
              <Button size="sm" className="w-full sm:w-auto font-black text-xs sm:text-sm">
                <FileText className="w-4 h-4 mr-1.5" />
                View Candidate Resume
              </Button>
            </a>
          )}
        </div>
      </Card>

      {/* Skills */}
      {profile.skills?.length > 0 && (
        <Card padding="lg" className="mb-6">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <Badge key={skill} variant="accent" size="md">
                {skill}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Experience */}
      {profile.experience && (
        <Card padding="lg" className="mb-6">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Experience</h2>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{profile.experience}</p>
        </Card>
      )}

      {/* Education */}
      {profile.education && (
        <Card padding="lg" className="mb-6">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Education</h2>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{profile.education}</p>
        </Card>
      )}

      {/* Certifications */}
      {profile.certifications?.length > 0 && (
        <Card padding="lg">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Certifications</h2>
          <div className="space-y-3">
            {profile.certifications.map((cert, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-slate-900">{cert.name}</p>
                  <p className="text-xs text-slate-500">{cert.issuer} • {cert.year}</p>
                </div>
                {cert.cert_url && (
                  <a
                    href={cert.cert_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-accent-600 hover:bg-accent-100 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
