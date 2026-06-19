import type { PrototypeAccount } from "@/components/golfalign/types";
import { sampleProfileImages } from "@/lib/mock/profileImages";

const isProduction = process.env.NODE_ENV === "production";

export const adminLoginId = process.env.ADMIN_LOGIN_ID || (isProduction ? "" : "aunova");
export const adminPassword = process.env.ADMIN_PASSWORD || (isProduction ? "" : "aunova3123");

export function isAdminCredential(username: string, password: string) {
  return Boolean(adminLoginId && adminPassword && username.trim() === adminLoginId && password === adminPassword);
}

export function createAdminAccount(): PrototypeAccount {
  return {
    id: "acc_admin_demo",
    username: adminLoginId,
    loginId: adminLoginId,
    password: adminPassword,
    authProvider: "local",
    emailVerified: true,
    role: "admin",
    displayName: "관리자",
    profileImageUrl: sampleProfileImages.kenji
  };
}
