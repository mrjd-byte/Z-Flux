// app/(main)/profile/page.tsx
export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white tracking-tight">Profile</h1>
      
      <div className="relative overflow-hidden p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none hover:scale-[1.01]">
        <h3 className="text-lg font-semibold text-white tracking-tight mb-4 relative z-10">User Details</h3>
        <p className="text-white/60 text-sm italic relative z-10 mb-2">Email: loading...</p>
        <p className="text-white/60 text-sm italic relative z-10">Income: loading...</p>
      </div>
    </div>
  );
}
