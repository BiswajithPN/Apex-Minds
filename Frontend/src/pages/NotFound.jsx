import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import Button from '../components/ui/Button';
import useAuthStore from '../store/authStore';

export default function NotFound() {
  const { role, homePath } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#f8fafb] flex items-center justify-center p-4">
      <div className="text-center animate-fade-in max-w-md">
        <h1 className="text-8xl font-black text-accent-500">404</h1>
        <h2 className="text-2xl font-bold text-slate-900 mt-4">Page Not Found</h2>
        <p className="text-slate-500 mt-2 text-sm">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>

        <div className="mt-8">
          <Link to={homePath(role)}>
            <Button size="md">
              <Home className="w-4 h-4" />
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
