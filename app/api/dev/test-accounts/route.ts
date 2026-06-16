import { NextResponse } from "next/server";
import { createLocalAccount, deleteLocalAccounts, listLocalAccounts } from "@/lib/local/prototypeDbServer";

const aunovaAccounts = [
  {
    username: "aunova1",
    displayName: "Aunova 회원 1",
    role: "member" as const,
    phone: "010-0000-1001"
  },
  {
    username: "aunova2",
    displayName: "Aunova 회원 2",
    role: "member" as const,
    phone: "010-0000-1002"
  },
  {
    username: "aunova3",
    displayName: "Aunova 프로 1",
    role: "pro" as const,
    organization: "GolfAlign 테스트 센터",
    phone: "010-0000-1003"
  },
  {
    username: "aunova4",
    displayName: "Aunova 회원 3",
    role: "member" as const,
    phone: "010-0000-1004"
  },
  {
    username: "aunova5",
    displayName: "Aunova 프로 2",
    role: "pro" as const,
    organization: "Aunova 레슨랩",
    phone: "010-0000-1005"
  }
];

const usernames = aunovaAccounts.map((account) => account.username);

export async function GET() {
  const accounts = await listLocalAccounts();
  return NextResponse.json({
    ok: true,
    accounts: accounts
      .filter((account) => usernames.includes(account.username))
      .map((account) => ({
        id: account.id,
        username: account.username,
        role: account.role,
        displayName: account.displayName,
        profileImageUrl: account.profileImageUrl
      }))
  });
}

export async function POST() {
  const results = [];

  for (const account of aunovaAccounts) {
    results.push(
      await createLocalAccount({
        ...account,
        password: "aunova3123"
      })
    );
  }

  return NextResponse.json({
    ok: true,
    accounts: results.map((result) => ({
      id: result.account.id,
      username: result.account.username,
      role: result.account.role,
      displayName: result.account.displayName,
      profileImageUrl: result.account.profileImageUrl,
      created: result.created
    }))
  });
}

export async function DELETE() {
  const result = await deleteLocalAccounts(usernames);
  return NextResponse.json({
    ok: true,
    ...result
  });
}
