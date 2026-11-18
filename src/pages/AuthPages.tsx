import { FormEvent, useState } from 'react';
import { AppPage, DemoUser } from '../types/campus';

interface SignInPageProps {
  onSignIn: (user: DemoUser) => void;
  onNavigate: (page: AppPage) => void;
}

export function SignInPage({ onSignIn, onNavigate }: SignInPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid demo email address (e.g., student@example.com).');
      return;
    }
    const nameFromEmail = email.split('@')[0].replace(/[._]/g, ' ');
    const formattedName =
      nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1) || 'LPU Student';
    onSignIn({ name: formattedName, email: email.trim() });
    onNavigate('dashboard');
  };

  const handleGuestContinue = () => {
    onSignIn({ name: 'Campus Visitor', email: 'guest@lpu-demo.local', isGuest: true });
    onNavigate('dashboard');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <div className="space-y-2 mb-8">
        <div className="text-xs font-bold tracking-wider text-[#2563EB]">STUDENT ACCESS</div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A]">Welcome back</h1>
        <p className="text-sm sm:text-base text-slate-600">
          Sign in to explore campus locations and save personal favourites.
        </p>
      </div>

      <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-7 shadow-xs">
        <h2 className="text-xl font-bold text-[#0F172A]">Sign in</h2>

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="signin-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email address
            </label>
            <input
              id="signin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label htmlFor="signin-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <input
              id="signin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors cursor-pointer"
          >
            Sign in
          </button>

          <button
            type="button"
            onClick={handleGuestContinue}
            className="w-full py-2.5 text-sm font-semibold text-[#0F172A] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Continue without login (Demo Guest)
          </button>
        </form>

        <p className="text-xs text-slate-500 mt-5">
          Demo only — no real LPU account or external authentication is required.
        </p>

        <button
          type="button"
          onClick={() => onNavigate('signup')}
          className="text-xs font-semibold text-[#2563EB] hover:underline mt-3 cursor-pointer"
        >
          New here? Create an account
        </button>
      </div>
    </div>
  );
}

interface SignUpPageProps {
  onSignIn: (user: DemoUser) => void;
  onNavigate: (page: AppPage) => void;
}

export function SignUpPage({ onSignIn, onNavigate }: SignUpPageProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim() || !email.trim() || !email.includes('@')) {
      setError('Please enter your name and a valid demo email address.');
      return;
    }
    onSignIn({ name: fullName.trim(), email: email.trim() });
    onNavigate('dashboard');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <div className="space-y-2 mb-8">
        <div className="text-xs font-bold tracking-wider text-[#2563EB]">JOIN CAMPUS NAVIGATOR</div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A]">Create your account</h1>
        <p className="text-sm sm:text-base text-slate-600">
          A simple demo sign-up screen for the student prototype.
        </p>
      </div>

      <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-7 shadow-xs">
        <h2 className="text-xl font-bold text-[#0F172A]">Create account</h2>

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="signup-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full name
            </label>
            <input
              id="signup-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email address
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors cursor-pointer"
          >
            Create account
          </button>
        </form>

        <p className="text-xs text-slate-500 mt-5">
          Demo only — use sample details for presentation.
        </p>

        <button
          type="button"
          onClick={() => onNavigate('signin')}
          className="text-xs font-semibold text-[#2563EB] hover:underline mt-3 cursor-pointer"
        >
          Already have an account? Sign in
        </button>
      </div>
    </div>
  );
}
