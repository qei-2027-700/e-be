import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getUser, isAdmin } from "@/lib/auth";

export default async function AdminPage() {
  const locale = await getLocale();

  const user = await getUser();
  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const admin = await isAdmin(user.id);
  if (!admin) {
    redirect(`/${locale}/dashboard`);
  }

  redirect(`/${locale}/admin/applications`);
}
