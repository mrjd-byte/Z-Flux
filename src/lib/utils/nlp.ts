/**
 * Simple Natural Language Parser for Financial Transactions
 * Handles formats like: 
 * "Spent 500 on Food"
 * "Logged 1200 for rent with Sam"
 * "Paid 300 to Sam"
 */
export function parseQuickLog(input: string) {
  const clean = input.toLowerCase();
  
  // 1. Extract Amount (Look for numbers)
  const amountMatch = clean.match(/(\d+(\.\d{1,2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[0]) : 0;
  
  // 2. Identify Category (Keyword mapping)
  const categories = ["food", "travel", "shopping", "bills", "rent", "salary", "investment", "bonus", "freelance", "grocery", "entertainment"];
  const category = categories.find(c => clean.includes(c)) || "General";
  
  // 3. Identify Type (Context)
  let type = "EXPENSE";
  if (clean.includes("paid") || clean.includes("spent") || clean.includes("gave")) {
    type = "EXPENSE";
  } else if (clean.includes("received") || clean.includes("got") || clean.includes("salary") || clean.includes("bonus")) {
    type = "INCOME";
  }

  // 4. Identify Potential Friend (Naively looking for 'with X' or 'to X')
  const friendSuffixes = ["with ", "to ", "from "];
  let friend = "";
  for (const suffix of friendSuffixes) {
    if (clean.includes(suffix)) {
      const parts = clean.split(suffix);
      if (parts.length > 1) {
        // Take the first word after the suffix as the name
        friend = parts[1].split(" ")[0].trim();
        break;
      }
    }
  }

  return {
    amount,
    category: category.charAt(0).toUpperCase() + category.slice(1),
    type,
    friend: friend.charAt(0).toUpperCase() + friend.slice(1),
    description: `Quick log: ${input}`
  };
}
