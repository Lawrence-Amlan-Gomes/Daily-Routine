// src/app/admin/page.tsx
import Admin from "@/components/AdminNew";
import HasAdminWrapper from "@/components/HasAdminWrapper";
import HasNotRegisteredWrapper from "@/components/HasNotRegisteredWrapper";
import { auth as getNextAuthSession } from "@/auth";
import { dbConnect } from "@/lib/mongo";
import { verifyToken } from "@/lib/server/jwt";
import { User } from "@/models/User";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await getNextAuthSession();
  const sessionEmail = session?.user?.email?.toLowerCase().trim();

  let isAdmin = false;

  if (sessionEmail) {
    await dbConnect();
    const dbUser = await User.findOne({ email: sessionEmail })
      .select("isAdmin")
      .lean<{ isAdmin?: boolean }>();
    isAdmin = Boolean(dbUser?.isAdmin);
  } else {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    if (token) {
      const tokenUser = await verifyToken(token);
      if (tokenUser?.email) {
        await dbConnect();
        const dbUser = await User.findOne({
          email: tokenUser.email.toLowerCase().trim(),
        })
          .select("isAdmin")
          .lean<{ isAdmin?: boolean }>();
        isAdmin = Boolean(dbUser?.isAdmin);
      }
    }
  }

  if (!isAdmin) redirect("/");

  return (
    <HasNotRegisteredWrapper>
      <HasAdminWrapper>
        <Admin />
      </HasAdminWrapper>
    </HasNotRegisteredWrapper>
  );
}
