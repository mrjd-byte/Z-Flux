// app/(main)/profile/page.tsx
export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold dark:text-white">Profile</h1>
      
      <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-gray-900 dark:text-white font-medium mb-4">User Details</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm italic">Email: loading...</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm italic">Income: loading...</p>
      </div>
    </div>
  );
}
