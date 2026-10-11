import { Link } from 'react-router-dom'

const FEATURES = [
  {
    icon: '🤖',
    title: 'Explainable AI',
    desc: 'Understand exactly why you received your score. Every factor is broken down transparently so retailers can take action.'
  },
  {
    icon: '📈',
    title: '300–900 Score Range',
    desc: 'Industry-standard scoring range gives lenders a familiar metric to evaluate creditworthiness with confidence.'
  },
  {
    icon: '⚡',
    title: 'Instant Results',
    desc: 'Receive a full credit assessment in under 2 minutes. No lengthy paperwork, no waiting days for a decision.'
  },
  {
    icon: '🔒',
    title: 'Privacy First',
    desc: 'Your financial data is encrypted and never shared without your consent. You stay in control of your information.'
  }
]

const STEPS = [
  {
    step: '01',
    title: 'Create Your Profile',
    desc: 'Sign up and fill in your shop details — name, location, business type, and years of operation.',
    color: 'from-blue-500 to-blue-600'
  },
  {
    step: '02',
    title: 'Enter Financial Data',
    desc: 'Provide monthly sales, expenses, inventory, and any existing loan repayment history.',
    color: 'from-indigo-500 to-indigo-600'
  },
  {
    step: '03',
    title: 'Get Your Score',
    desc: 'Our AI engine calculates your credit score instantly with a full breakdown and improvement tips.',
    color: 'from-violet-500 to-violet-600'
  }
]

const STATS = [
  { value: '12+', label: 'Retailers Assessed' },
  { value: '300–900', label: 'Score Range' },
  { value: '< 2 min', label: 'Time to Assess' },
  { value: '100%', label: 'Transparent Scoring' }
]

export default function Landing() {
  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏦</span>
            <span className="text-xl font-bold text-gray-900">CreditLens</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 pt-16">
        {/* Background decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500 rounded-full opacity-20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400 rounded-full opacity-20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600 rounded-full opacity-10 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          {/* Pill badge */}
          <span className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm border border-white/20">
            🚀 &nbsp;Powered by Machine Learning
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
            AI-Powered Credit Assessment
            <span className="block text-blue-200 mt-1">for Small Retailers</span>
          </h1>

          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            CreditLens helps kirana stores, grocery shops, and micro-retailers build a verified
            credit profile — no bank statements required. Get your score in minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-8 py-4 rounded-xl text-base shadow-lg shadow-blue-900/30 transition-all hover:scale-105"
            >
              Get Started — It's Free
            </Link>
            <button
              onClick={scrollToHowItWorks}
              className="border-2 border-white/40 hover:border-white text-white font-medium px-8 py-4 rounded-xl text-base transition-all hover:bg-white/10 backdrop-blur-sm"
            >
              Learn More ↓
            </button>
          </div>

          {/* Floating stat chips */}
          <div className="flex flex-wrap justify-center gap-3 mt-14">
            {['✅ No collateral needed', '📱 Mobile-friendly', '🔐 Bank-grade security'].map(t => (
              <span
                key={t}
                className="bg-white/10 border border-white/20 text-white/90 text-sm px-4 py-2 rounded-full backdrop-blur-sm"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 inset-x-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L1440 80L1440 30C1200 80 960 0 720 30C480 60 240 0 0 30L0 80Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-white py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl sm:text-4xl font-extrabold text-blue-600 mb-1">{value}</p>
                <p className="text-sm text-gray-500 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
              Your credit score in 3 simple steps
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              We've removed the complexity from credit assessment. No jargon, no hidden steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-14 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-blue-200 to-indigo-200" />

            {STEPS.map(({ step, title, desc, color }) => (
              <div key={step} className="relative bg-white rounded-2xl p-7 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} text-white text-xl font-extrabold flex items-center justify-center mx-auto mb-5 shadow-lg`}>
                  {step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-indigo-600 font-semibold text-sm uppercase tracking-widest">Features</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
              Everything you need to build credit
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Designed specifically for India's 60 million micro and small retailers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all duration-200"
              >
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="text-base font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial / Trust strip ── */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50 border-y border-blue-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-lg text-gray-700 font-medium italic leading-relaxed max-w-2xl mx-auto">
            "Traditional banks rejected me without explanation. CreditLens showed me exactly what
            to improve and I got a loan within a month."
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm">R</div>
            <span className="text-sm font-semibold text-gray-700">Ramesh K.</span>
            <span className="text-sm text-gray-400">· Kirana Store Owner, Bengaluru</span>
          </div>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section className="py-24 bg-gradient-to-br from-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500 rounded-full opacity-20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-400 rounded-full opacity-20 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to get assessed?
          </h2>
          <p className="text-blue-200 text-lg mb-10 leading-relaxed">
            Join hundreds of small retailers who have already taken control of their financial future.
            Your score is just 2 minutes away.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-10 py-4 rounded-xl text-base shadow-xl shadow-blue-900/30 transition-all hover:scale-105"
            >
              Create Free Account →
            </Link>
            <Link
              to="/login"
              className="border-2 border-white/40 hover:border-white text-white font-medium px-10 py-4 rounded-xl text-base transition-all hover:bg-white/10"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏦</span>
            <span className="font-bold text-white">CreditLens</span>
            <span className="text-xs ml-2">© {new Date().getFullYear()}</span>
          </div>
          <p className="text-xs text-center">
            AI-powered credit assessment for small and micro retailers across India.
          </p>
          <div className="flex gap-4 text-xs">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-white cursor-pointer transition-colors">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
