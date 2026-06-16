import type { PrototypeAccount } from "@/components/golfalign/types";

export const sampleProfileImages = {
  ben: "/assets/profiles/ben.png",
  chloe: "/assets/profiles/chloe.png",
  david: "/assets/profiles/david.png",
  elena: "/assets/profiles/elena.png",
  fatima: "/assets/profiles/fatima.png",
  kenji: "/assets/profiles/kenji.png",
  liam: "/assets/profiles/liam.png",
  miSook: "/assets/profiles/mi-sook.png",
  raj: "/assets/profiles/raj.png",
  sarah: "/assets/profiles/sarah.png"
} as const;

const memberSamples = [
  sampleProfileImages.miSook,
  sampleProfileImages.sarah,
  sampleProfileImages.fatima,
  sampleProfileImages.liam,
  sampleProfileImages.raj,
  sampleProfileImages.chloe
];

const proSamples = [
  sampleProfileImages.david,
  sampleProfileImages.kenji,
  sampleProfileImages.elena,
  sampleProfileImages.ben
];

const explicitProfileByAccountId: Record<string, string> = {
  acc_member_demo: sampleProfileImages.miSook,
  acc_pro_demo: sampleProfileImages.david,
  acc_admin_demo: sampleProfileImages.kenji
};

export function resolveProfileImageForAccount(account: Pick<PrototypeAccount, "id" | "role">, index = 0) {
  if (explicitProfileByAccountId[account.id]) {
    return explicitProfileByAccountId[account.id];
  }

  const pool = account.role === "pro" ? proSamples : memberSamples;
  return pool[index % pool.length];
}

