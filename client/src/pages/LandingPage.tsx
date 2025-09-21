import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen relative bg-black text-white overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40" />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center animate-fade">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">The Draft – Auditions Hub</h1>
        <p className="mt-4 text-xl md:text-2xl text-gray-200">Streamlined Auditions, Director’s Choice</p>
        <button
          onClick={() => navigate('/login')}
          className="mt-10 px-6 py-3 rounded-full bg-netflix-red hover:brightness-110 transition">
          Enter Auditions Portal
        </button>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
    </div>
  );
}
