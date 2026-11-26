import { AppShell } from "@/components/AppShell";
import { getAuthUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  return (
    <AppShell
      user={
        user
          ? { name: user.name, email: user.email, role: user.role }
          : null
      }
    >
      {children}
    </AppShell>
  );
}
