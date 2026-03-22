"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  operatorApplications,
  companies,
  organizations,
  organizationMembers,
  users,
} from "@e-be/db/schema";
import { eq } from "drizzle-orm";

type State = { success: true } | { success: false; error: string } | null;

export async function approveApplication(
  _prev: State,
  formData: FormData
): Promise<State> {
  const applicationId = String(formData.get("applicationId") ?? "");
  const applicantUserId = String(formData.get("applicantUserId") ?? "");
  const orgName = String(formData.get("orgName") ?? "");
  const orgSlug = String(formData.get("orgSlug") ?? "");
  const companyName = String(formData.get("companyName") ?? "");
  const address = String(formData.get("address") ?? "") || null;
  const description = String(formData.get("description") ?? "") || null;
  const reviewerUserId = String(formData.get("reviewerUserId") ?? "");
  const locale = String(formData.get("locale") ?? "ja");

  // トランザクション: 会社 → 組織 → メンバー → userType 更新 → 申請ステータス更新
  await db.transaction(async (tx) => {
    // 1. companies に insert
    const [company] = await tx
      .insert(companies)
      .values({
        name: companyName,
        slug: orgSlug, // 法人スラッグも同じにする（TBD: 別途設定できるようにする）
      })
      .returning({ id: companies.id });

    // 2. organizations に insert
    const [org] = await tx
      .insert(organizations)
      .values({
        companyId: company.id,
        name: orgName,
        slug: orgSlug,
        address,
        description,
      })
      .returning({ id: organizations.id });

    // 3. organization_members に insert（申請者を owner として追加）
    await tx.insert(organizationMembers).values({
      orgId: org.id,
      userId: applicantUserId,
      role: "owner",
    });

    // 4. users.userType を venue_user に更新
    await tx
      .update(users)
      .set({ userType: "venue_user" })
      .where(eq(users.id, applicantUserId));

    // 5. operator_applications を approved に更新
    await tx
      .update(operatorApplications)
      .set({
        status: "approved",
        reviewedBy: reviewerUserId,
        reviewedAt: new Date(),
      })
      .where(eq(operatorApplications.id, applicationId));
  });

  redirect(`/${locale}/admin/applications`);
}

export async function rejectApplication(
  _prev: State,
  formData: FormData
): Promise<State> {
  const applicationId = String(formData.get("applicationId") ?? "");
  const reviewerUserId = String(formData.get("reviewerUserId") ?? "");
  const reviewNote = String(formData.get("reviewNote") ?? "") || null;
  const locale = String(formData.get("locale") ?? "ja");

  await db
    .update(operatorApplications)
    .set({
      status: "rejected",
      reviewedBy: reviewerUserId,
      reviewedAt: new Date(),
      reviewNote,
    })
    .where(eq(operatorApplications.id, applicationId));

  redirect(`/${locale}/admin/applications`);
}
