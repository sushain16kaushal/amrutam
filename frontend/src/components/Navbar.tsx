// components/Navbar.tsx
'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const { token, role, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    setMobileMenuOpen(false);
    router.push('/');
  }

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-slate-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold gradient-text tracking-tight">MediAdvisor</span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/doctors" className="text-slate-600 hover:text-sky-600 font-medium transition-colors">
              Find Doctors
            </Link>
            {token && role === 'patient' && (
              <Link href="/consultations" className="text-slate-600 hover:text-sky-600 font-medium transition-colors">
                My Consultations
              </Link>
            )}
            {token && role === 'doctor' && (
              <Link href="/doctor-dashboard" className="text-slate-600 hover:text-sky-600 font-medium transition-colors">
                Dashboard
              </Link>
            )}
            {token && role === 'admin' && (
              <Link href="/admin/moderation" className="text-slate-600 hover:text-sky-600 font-medium transition-colors">
                Moderation
              </Link>
            )}
            
            <div className="flex items-center gap-4 border-l border-slate-200 pl-6 ml-2">
              {token ? (
                <>
                  <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                    {role}
                  </span>
                  <Link href="/settings" className="text-slate-500 hover:text-sky-600 transition-colors">
                    Settings
                  </Link>
                  <button onClick={handleLogout} className="text-slate-500 hover:text-red-600 text-sm font-medium transition-colors">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/doctors/login" className="text-slate-600 hover:text-sky-600 font-medium transition-colors">
                    For Doctors
                  </Link>
                  <Link href="/login" className="btn-primary text-sm px-5 py-2 rounded-full shadow-sm hover:shadow-md">
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-500 hover:text-sky-600 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 shadow-lg absolute w-full animate-fade-in">
          <div className="px-4 pt-2 pb-6 space-y-2">
            <Link href="/doctors" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-sky-600 rounded-md">
              Find Doctors
            </Link>
            {token && role === 'patient' && (
              <Link href="/consultations" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-sky-600 rounded-md">
                My Consultations
              </Link>
            )}
            {token && role === 'doctor' && (
              <Link href="/doctor-dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-sky-600 rounded-md">
                Dashboard
              </Link>
            )}
            {token && role === 'admin' && (
              <Link href="/admin/moderation" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-sky-600 rounded-md">
                Moderation
              </Link>
            )}
            
            <div className="pt-4 mt-2 border-t border-slate-100 flex flex-col gap-2">
              {token ? (
                <>
                  <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-sky-600 rounded-md">
                    Settings
                  </Link>
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md">
                    Logout ({role})
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block text-center w-full btn-primary rounded-lg py-3 mt-2">
                    Login / Sign up
                  </Link>
                  <Link href="/doctors/login" onClick={() => setMobileMenuOpen(false)} className="block text-center w-full btn-secondary rounded-lg py-3 mt-2">
                    Sign in as a Doctor
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}