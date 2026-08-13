import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pt-16 md:pt-24 pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-sky-100 via-white to-white opacity-80" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-100 text-sky-700 text-sm font-medium mb-8 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-pulse-soft" />
            Next-Gen AI Healthcare
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8">
            Expert medical advice,<br />
            <span className="gradient-text">Anytime, Anywhere.</span>
          </h1>
          
          <p className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect with certified human specialists or our 24/7 AI doctors for immediate, accurate, and empathetic medical consultations.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/doctors" className="btn-primary text-lg px-8 py-4 shadow-sky-200">
              Book a Consultation
            </Link>
            <Link href="/login" className="btn-secondary text-lg px-8 py-4">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50 relative -mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card text-center hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl group-hover:scale-110 transition-transform">
                🤖
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">24/7 AI Doctors</h3>
              <p className="text-slate-600 leading-relaxed">
                Instant access to our highly trained medical AI for initial assessments and round-the-clock guidance.
              </p>
            </div>
            
            <div className="card text-center hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl group-hover:scale-110 transition-transform">
                👨‍⚕️
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Top Specialists</h3>
              <p className="text-slate-600 leading-relaxed">
                Connect with verified human doctors across 10+ specialties through secure real-time chat and prescriptions.
              </p>
            </div>

            <div className="card text-center hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl group-hover:scale-110 transition-transform">
                📋
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Your Health Report</h3>
              <p className="text-slate-600 leading-relaxed">
                Every AI consultation ends with a structured health report — your symptoms, summary, and next steps, ready to share with any doctor.
              </p>
            </div>
            
            <div className="card text-center hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl group-hover:scale-110 transition-transform">
                🛡️
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Safe & Secure</h3>
              <p className="text-slate-600 leading-relaxed">
                End-to-end encrypted messaging, strict content moderation, and verified medical professionals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            Ready to take control of your health?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Join thousands of patients who trust MediAdvisor for their medical needs.
          </p>
          <Link href="/register" className="btn-primary inline-flex text-lg px-8 py-4">
            Get Started Now
          </Link>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 text-center">
        <p>© 2026 MediAdvisor. Built for a healthier tomorrow.</p>
      </footer>
    </div>
  );
}
