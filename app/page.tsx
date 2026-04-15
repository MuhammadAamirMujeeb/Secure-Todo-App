import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/server/auth";

export default async function LandingPage(): Promise<React.ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] px-4">
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-1.5 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
              <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
            </svg>
            AES-256-GCM Encrypted
          </div>

          <h1 className="text-5xl font-bold text-[var(--text-primary)] font-heading leading-tight">
            Secure Todo
          </h1>

          <p className="text-lg text-[var(--text-muted)] max-w-sm mx-auto">
            An encrypted task manager. Your tasks are encrypted at rest —
            only you can read them.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/sign-up"
            className="btn-primary text-base px-6 py-3 rounded-lg"
          >
            Get started
          </Link>
          <Link
            href="/sign-in"
            className="btn-ghost text-base px-6 py-3 rounded-lg"
          >
            Sign in
          </Link>
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          Built with Next.js · Drizzle ORM · BetterAuth · SQLite
        </p>
      </div>
    </main>
  );
}
