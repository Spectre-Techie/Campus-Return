import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-14rem)] max-w-6xl items-center justify-center rounded-3xl border border-[var(--border)] bg-[linear-gradient(145deg,#fbfcfd_0%,#edf3f6_100%)] px-4 py-10 sm:px-6">
      <div className="grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div className="hidden lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[var(--brand)]">Sign in</p>
          <h1 className="font-display mt-2 text-4xl font-semibold leading-tight text-[var(--brand-deep)]">
            Continue Your Recovery Workflow
          </h1>
          <p className="mt-3 max-w-md text-sm text-[var(--ink-muted)]">
            Access claim reviews, private handoff chat, and all operational updates from one secure account.
          </p>
        </div>

        <SignIn
          appearance={{
            variables: {
              colorPrimary: "#0f6462",
              colorBackground: "#ffffff",
              colorText: "#1e2b36",
              colorInputBackground: "#eef3f6",
              colorInputText: "#1e2b36",
              borderRadius: "0.9rem",
            },
            elements: {
              rootBox: "mx-auto w-full",
              card: "w-full rounded-2xl border border-[var(--border)] shadow-[0_16px_42px_rgba(30,43,54,0.14)]",
              headerTitle: "font-display text-[var(--brand-deep)]",
              headerSubtitle: "text-[var(--ink-muted)]",
              formButtonPrimary: "bg-[var(--brand-deep)] hover:bg-[var(--brand)]",
              socialButtonsBlockButton:
                "border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--brand-soft)]",
              formFieldInput:
                "border border-[var(--border)] bg-[var(--surface-2)] focus:border-[var(--brand)]",
            },
          }}
        />
      </div>
    </div>
  );
}
