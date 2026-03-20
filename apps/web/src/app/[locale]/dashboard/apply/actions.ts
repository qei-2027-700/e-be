"use server";

import { db } from "@/lib/db";
import { operatorApplications, organizations } from "@e-be/db/schema";
import { eq, and, isNull } from "drizzle-orm";

type State = { success: true } | { success: false; error: string } | null;

export async function submitApplication(
  _prev: State,
  formData: FormData
): Promise<State> {
  const userId = String(formData.get("userId") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const orgName = String(formData.get("orgName") ?? "").trim();
  const orgSlug = String(formData.get("orgSlug") ?? "").trim().toLowerCase();
  const description = String(formData.get("orgDescription") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;

  // スラッグのバリデーション
  if (!/^[a-z0-9-]+$/.test(orgSlug)) {
    return { success: false, error: "スラッグは英数字とハイフンのみ使用できます" };
  }

  // スラッグの重複チェック（operator_applications 内でも確認）
  const existingOrg = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(and(eq(organizations.slug, orgSlug), isNull(organizations.deletedAt)))
    .limit(1);

  if (existingOrg.length > 0) {
    return { success: false, error: "このスラッグはすでに使用されています" };
  }

  // 申請中の重複チェック
  const existingApp = await db
    .select({ id: operatorApplications.id })
    .from(operatorApplications)
    .where(
      and(
        eq(operatorApplications.userId, userId),
        eq(operatorApplications.status, "pending"),
        isNull(operatorApplications.deletedAt)
      )
    )
    .limit(1);

  if (existingApp.length > 0) {
    return { success: false, error: "すでに申請中です" };
  }

  await db.insert(operatorApplications).values({
    userId,
    companyName,
    orgName,
    orgSlug,
    description,
    address,
    status: "pending",
  });

  return { success: true };
}
