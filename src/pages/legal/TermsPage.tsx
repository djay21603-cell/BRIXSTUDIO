import { usePageTitle } from '../../hooks/usePageTitle'
import { site } from '../../data/site'

export function TermsPage() {
  usePageTitle('Terms of service — BRIX Studio')

  return (
    <article className="shell max-w-3xl py-16 lg:py-20">
      <p className="eyebrow text-clay">
        <span className="h-px w-6 bg-clay" aria-hidden="true" />
        Legal
      </p>
      <h1 className="display mt-5 text-[clamp(2.6rem,5vw,4.4rem)] text-ink">Terms of service.</h1>
      <p className="mt-5 text-[12px] text-ink/40">Last updated 14 November 2026 · Phase 0 foundation</p>

      <div className="mt-10 space-y-8 text-[13.5px] leading-relaxed text-ink/60">
        <section>
          <h2 className="text-[15px] font-semibold text-ink">The service</h2>
          <p className="mt-2">
            BRIX Studio provides a website project builder and, over time, additional creative and business
            tools. During the foundation phase, accounts, workspaces and private file storage are available.
            Some modules are marked as planned and only open a preview shell.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-ink">Accounts</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Provide accurate details and keep your password private.</li>
            <li>You are responsible for activity under your account.</li>
            <li>Do not share a single account between unrelated people; use workspace invitations instead.</li>
            <li>Tell us promptly if you believe your account has been compromised.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-ink">Acceptable use</h2>
          <p className="mt-2">
            Do not use the service to upload or share unlawful, infringing, abusive or malicious material,
            to attempt unauthorised access, to disrupt the service, or to send unsolicited bulk email. We
            may suspend accounts that put other people or the platform at risk.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-ink">Uploads and storage</h2>
          <p className="mt-2">
            You keep ownership of the files you upload and confirm you have the right to use them. Uploads
            are limited to PNG, JPEG, GIF, WebP and PDF files within the per-file and per-account limits
            shown in the app. Files are private to your account except for administrators responding to a
            support or security issue.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-ink">Free phase and payments</h2>
          <p className="mt-2">
            No payment is collected and no paid plan is active. Payment processing, credits and paid AI
            providers will only be introduced after explicit approval and with clear pricing shown before
            use.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-ink">Project briefs and quotes</h2>
          <p className="mt-2">
            Submitting a project configuration is a request for a conversation, not a binding order. Scope,
            price and timing are confirmed separately in writing by the studio.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-ink">Intellectual property</h2>
          <p className="mt-2">
            The BRIX Studio name, interface and original design system remain the studio&apos;s property.
            Content you provide remains yours. Generated module output will be governed by the terms shown
            when those modules launch.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-ink">Availability and liability</h2>
          <p className="mt-2">
            The service is provided as available while it is being built. Free hosting may restart or go to
            sleep, and storage may be reset if no persistent disk is configured. To the extent permitted by
            law, the studio is not liable for indirect losses arising from use of the free foundation
            features. Keep your own copy of important files.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-ink">Ending use</h2>
          <p className="mt-2">
            You can delete your account at any time from the account page. We may suspend or remove accounts
            that breach these terms or create a security risk. Deleting an account removes the login,
            sessions, memberships and uploaded files.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-ink">Contact</h2>
          <p className="mt-2">
            Questions about these terms can be sent to{' '}
            <a href={`mailto:${site.email}`} className="text-ink underline underline-offset-4">
              {site.email}
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  )
}
