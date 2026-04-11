import Link from "next/link";
import { ArrowRight, BrainCircuit, PieChart, Wallet, PlusCircle, Activity, ChevronRight, BarChart3, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30">
      {/* Background glowing effects */}
      <div className="fixed inset-0 min-h-screen z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navbar */}
        <header className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">Z-Flux</span>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                Login
              </Link>
              <Link 
                href="/signup" 
                className="text-sm font-medium text-white bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-full transition-all border border-white/5 active:scale-95"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-grow pt-20">
          {/* Hero Section */}
          <section className="relative px-6 py-24 md:py-40 flex flex-col items-center justify-center text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs sm:text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              <span>AI-Powered Financial Intelligence</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
              Smart financial planning based on your income
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-12">
              Track expenses, set budgets, and get AI-driven financial advice. Build a healthier relationship with your money today.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link 
                href="/signup" 
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-medium transition-all flex items-center justify-center gap-2 group hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95"
              >
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/login" 
                className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-medium transition-all active:scale-95"
              >
                Login to Dashboard
              </Link>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-24 border-t border-white/5 bg-white/[0.02]">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to master your finances</h2>
                <p className="text-zinc-400 text-lg">Powerful tools designed to give you clarity and control.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-colors group">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <PieChart className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Expense Tracking</h3>
                  <p className="text-zinc-400">
                    Automatically categorize and track your spending in real-time. Know exactly where your money is going.
                  </p>
                </div>
                
                {/* Feature 2 */}
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-colors group">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Wallet className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Budget Management</h3>
                  <p className="text-zinc-400">
                    Smart budgeting that adapts to your income. Get alerted before you overspend in any category.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors group">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <BrainCircuit className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">AI Financial Advisor</h3>
                  <p className="text-zinc-400">
                    Get personalized, actionable insights based on your spending habits to optimize your savings.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="py-24">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
                <p className="text-zinc-400 text-lg">Three simple steps to financial freedom.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 relative">
                {/* Connecting Line */}
                <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-y-1/2 z-0" />

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-black border border-white/10 flex items-center justify-center mb-6 shadow-xl">
                    <PlusCircle className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Step 1: Add income</h3>
                  <p className="text-sm text-zinc-400">Connect your accounts or manually add your recurring income sources.</p>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-black border border-white/10 flex items-center justify-center mb-6 shadow-xl">
                    <Activity className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Step 2: Track expenses</h3>
                  <p className="text-sm text-zinc-400">Let Z-Flux categorize your spending out-of-the-box with high precision.</p>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-black border border-white/10 flex items-center justify-center mb-6 shadow-xl">
                    <BarChart3 className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Step 3: Get insights</h3>
                  <p className="text-sm text-zinc-400">Receive custom AI recommendations to maximize your wealth growth.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="py-24 px-6 md:px-12">
            <div className="max-w-5xl mx-auto rounded-3xl p-10 md:p-16 bg-gradient-to-b from-indigo-900/40 to-black border border-white/10 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />
              
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Start managing your money smarter</h2>
                <p className="text-lg text-zinc-400 mb-10 max-w-2xl mx-auto">
                  Join thousands of users who have transformed their financial lives with Z-Flux. Set up takes less than 2 minutes.
                </p>
                <Link 
                  href="/signup" 
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black hover:bg-zinc-200 rounded-full font-semibold transition-all active:scale-95"
                >
                  Create Your Free Account
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="py-8 border-t border-white/5 text-center text-sm text-zinc-500">
          <p>© {new Date().getFullYear()} Z-Flux. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
