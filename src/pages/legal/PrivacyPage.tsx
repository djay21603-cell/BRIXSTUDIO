import { usePageTitle } from '../../hooks/usePageTitle'
import { site } from '../../data/site'

export function PrivacyPage() {
  usePageTitle('Privacy policy — BRIX Studio')

  return (
    <article className="shell max-w-3xl py-16 lg:py-20">
      <p className="eyebrow text-clay">
        <span className="h-px w-6 bg-clay" aria-hidden="true" />
        Legal
      </p>
      <h1 className="display mt-5 text-[clamp(2.6rem,5vw,4.4rem)] text-ink">Privacy policy.</h1>
      <p className="mt-5 text-[12px] text-ink/40">Last updated 14 November 2026 · Phase 0 foundation</p>

      <div className="mt-10 space-y-8 text-[13.5px] leading-relaxed text-ink/60">
        <section>
          <h2 className="text-[15px] font-semibold text-ink">Who we are</h2>
          <p className="mt-2">
            BRIX Studio operates this website and the account features described here. Questions about
            privacy can be sent to{' '}
            <a href={`mailto:${site.email}`} className="text-ink underline underline-offset-4">
              {site.email}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-ink">What we collect</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Account details: your name, email address and a scrypt password hash. We never store the password itself.</li>
            <li>Session details: an opaque session token stored in a secure, http-only cookie, plus the IP address and browser user agent recorded when you sign in.</li>
            <li>Workspace data: workspace names, memberships and roles.</li>
            <li>Uploads: the file you choose, its original name, detected type, size, checksum and upload time.</li>
            <li>Security events: sign-ins, account changes, uploads, administrator actions and deletions, kept for safety and support.</li>
            <li>Project briefs you create in the builder remain in your browser until you submit them by email or the request form.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-ink">What we do not do</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>We do not collect payment details. No subscriptions, credits or payment processing are enabled in this phase.</li>
            <li>We do not enable paid AI providers automatically. The project assistant falls back to a built-in planner unless the studio explicitly configures a provider.</li>
            <li>We do not sell personal data or add third-party advertising trackers.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-ink">Cookies and local storage</h2>
          <p className="mt-2">
            The only cookie used for accounts is <code className="text-ink/80">brix_session</code>, which keeps
            you signed in. It is http-only, SameSite=Lax and sent only to this site. The project builder
            stores your draft in your browser&apos;s local storage so you can leave and return.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-ink">How long we keep data</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Sessions expire after 30 days or when you sign out.</li>
            <li>Security audit events are kept for up to 180 days.</li>
            <li>Uploads stay until you delete them or delete your account.</li>
            <li>Deleting your account removes your login, sessions, workspace memberships, audit linkage and stored files.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-ink">Hosting and service providers</h2>
          <p className="mt-2">
            Account data and uploads are stored on the server that hosts this site. Project requests you
            choose to submit are delivered by email through the studio&apos;s Gmail account. Free hosting
            plans may use ephemeral disk storage; the studio will configure persistent storage before
            treating the platform as a permanent record.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-ink">Your choices</h2>
          <p className="mt-2">
            From your account page you can update your name, change your password, download a JSON export of
            your account data and delete your account. You can also email us to ask for a correction or
            deletion. We respond to verified requests as quickly as we can.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-ink">Security</h2>
          <p className="mt-2">
            Passwords are hashed with scrypt. Sessions use random tokens whose hashes are stored server-side.
            State-changing requests are checked for a trusted origin, uploads are validated by file
            signature, and authentication, upload and submission endpoints are rate limited.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-ink">Children</h2>
          <p className="mt-2">
            Accounts are intended for people aged 16 and over. Contact us if you believe a younger person
            has created an account so we can remove it.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-ink">Changes</h2>
          <p className="mt-2">
            This policy will be updated as new modules and providers are introduced. Material changes will
            be noted on this page with a new date.
          </p>
        </section>
      </div>
    </article>
  )
}
