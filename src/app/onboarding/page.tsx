"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [generateSampleData, setGenerateSampleData] = useState(false);
  
  const [budgets, setBudgets] = useState({
    Food: 0,
    Travel: 0,
    Shopping: 0,
    Bills: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Basic guard
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const handleBudgetChange = (category: string, value: string) => {
    setBudgets((prev: any) => ({
      ...prev,
      [category]: Number(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");

    const formattedBudgets = Object.keys(budgets).map(key => ({
      category: key,
      amount: (budgets as any)[key]
    }));

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          monthlyIncome,
          budgets: formattedBudgets,
          generateSampleData
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to onboard.");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-10">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6 dark:text-white">Let's set up your finances</h2>
        
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Monthly Income (₹)</label>
            <input
              type="number"
              min="0"
              value={monthlyIncome || ""}
              onChange={(e) => setMonthlyIncome(Number(e.target.value))}
              required
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-1">Budgets</h3>
            <div className="space-y-3">
              {Object.keys(budgets).map((category) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm dark:text-gray-400 w-1/3">{category}</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={(budgets as any)[category] || ""}
                    onChange={(e) => handleBudgetChange(category, e.target.value)}
                    className="w-2/3 px-3 py-1 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-right"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
            <input
              id="sampleData"
              type="checkbox"
              checked={generateSampleData}
              onChange={(e) => setGenerateSampleData(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="sampleData" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
              Generate Sample Data
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}
