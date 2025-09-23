import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import landingBg from '../assets/landing_bg.png';

export default function LandingPage() {
  const navigate = useNavigate();
  // Use the image from src/assets so Vite bundles and serves it reliably
  const bgStyle = useMemo(() => ({ backgroundImage: `url(${landingBg})` }), []);
  return (
    <div className="min-h-screen relative bg-black text-white overflow-hidden">
      {/* Background image layer (full opacity) */}
      <div className="absolute inset-0 bg-no-repeat bg-cover bg-center" style={bgStyle} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center animate-pop px-6">
        <div className="max-w-3xl">
          <span className="inline-block text-xs tracking-widest uppercase text-neutral-300/80">Welcome to</span>
          <h1 className="mt-2 text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight">
            <span className="bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent drop-shadow">The Hostel Files</span>
          </h1>
          <div className="mt-10 flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 rounded-full bg-netflix-red hover:brightness-110 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              aria-label="Login to continue"
            >
              Login to Continue
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
