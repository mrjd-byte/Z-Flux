import { prisma } from "./prisma";

/**
 * Generates a unique wallet ID for Z-Flux users.
 * Format: "ZF" + random uppercase letters + numbers (8-10 chars total)
 */
export function generateWalletId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const length = 6 + Math.floor(Math.random() * 3); // 6 to 8 random chars
  let walletId = "ZF";
  for (let i = 0; i < length; i++) {
    walletId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return walletId;
}

/**
 * Ensures a generated walletId is unique in the database.
 */
export async function ensureUniqueWalletId(): Promise<string> {
  let walletId = generateWalletId();
  let exists = await prisma.user.findUnique({
    where: { walletId }
  });

  while (exists) {
    walletId = generateWalletId();
    exists = await prisma.user.findUnique({
      where: { walletId }
    });
  }

  return walletId;
}
