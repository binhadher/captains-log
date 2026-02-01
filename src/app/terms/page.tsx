'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">CAPTAIN'S LOG GENERAL TERMS AND CONDITIONS</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-4 uppercase text-sm">
          BY USING / REGISTERING TO THE CAPTAIN'S LOG APP/WEBSITE AND ACCEPTING THESE TERMS AND CONDITIONS ("Terms and Conditions" or "Terms"), THE CUSTOMER ("END-USER") AGREES TO BE LEGALLY BOUND BY THESE TERMS AND CONDITIONS.
        </p>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Last Updated: February 1, 2025</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
          
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">RECITALS</h2>
            <p>
              References to 'We', 'Our', 'Us' and 'Captain's Log' refer to Captain's Log, operated under the laws of Dubai, United Arab Emirates ("UAE").
            </p>
            <p className="mt-2">
              References to 'You', 'End-User' and 'Your' refer to the individual who accesses the Captain's Log online application ("Captain's Log App" or "App") or the Captain's Log website, being www.captainlog.ae ("Captain's Log Website") along with all associated services, (collectively, the "Platform").
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">1. INTRODUCTION AND SCOPE</h2>
            <p>
              These Terms constitute a legally binding agreement between You and Captain's Log governing your access to and use of the Captain's Log Website and App (i.e. the Platform).
            </p>
            <p className="mt-2">
              These Terms set out the rights, obligations, and permitted use of the Captain's Log Platform, and are enforceable under the laws of the UAE. By accessing the Platform, you acknowledge that you have read, understood, and agreed to be bound by these Terms.
            </p>
            <p className="mt-2 font-semibold">
              If you do not agree to these Terms, you must not use the Captain's Log Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">2. PLATFORM OVERVIEW</h2>
            <p>
              The Captain's Log Platform is a boat maintenance tracking and management application that enables You to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Record and track maintenance activities for boats and marine vessels</li>
              <li>Store documents including registration certificates, insurance policies, and service records</li>
              <li>Set service schedules and receive maintenance reminders</li>
              <li>Track costs and expenses related to boat maintenance</li>
              <li>Manage crew information and documents</li>
            </ul>
            <p className="mt-4">
              The Platform is provided "as is" for informational and organizational purposes only. Captain's Log operates on a business-agnostic basis and is hosted on a secure, internet-based infrastructure and cloud-based server.
            </p>
            <p className="mt-2 font-semibold">
              The Platform is not a substitute for professional marine maintenance advice, inspections, or surveys. Any decisions made based on information stored in the Platform are made at Your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">3. USER ACCOUNTS AND REGISTRATION</h2>
            <p>
              To be eligible to access and use the Captain's Log Platform, the End-User must:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Maintain a valid email address to be registered with the Captain's Log Platform</li>
              <li>Represent and warrant that they are at least eighteen (18) years of age at the time of registration</li>
            </ul>
            <p className="mt-4">
              Captain's Log reserves the right to suspend or terminate any account if it reasonably believes that the account holder is a minor or has otherwise misrepresented their eligibility. Parents or legal guardians remain responsible for supervising any minor who accesses the Platform in breach of these Terms.
            </p>
            <p className="mt-2">
              <strong>Customer Due Diligence:</strong> Captain's Log may decline or revoke access to the Platform at its sole discretion if the End-User fails to meet our onboarding, operational, or compliance standards.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">4. PERMITTED AND PROHIBITED USE</h2>
            <p>
              If You believe that Your account has been accessed without Your knowledge or consent, or that Your login credentials have been compromised or used fraudulently, You must immediately notify Captain's Log via email. You must take all reasonable precautions to safeguard access to the Platform and shall not, under any circumstances, permit any Third Party to access or use the Platform on Your behalf.
            </p>
            <p className="mt-4">You are solely responsible for:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Providing true, complete, and accurate information</li>
              <li>Maintaining the confidentiality of Your account credentials</li>
              <li>All activities that occur under Your account</li>
              <li>Ensuring the accuracy and completeness of all maintenance records and data You enter</li>
              <li>Complying with all applicable laws and regulations</li>
            </ul>
            <p className="mt-4">You shall not use the Captain's Log Platform for any purpose that contravenes applicable laws, regulations, or governmental directives. Any penalties, fines, or sanctions imposed by a regulatory authority in connection with Your use of the Platform shall be borne solely by You.</p>
            <p className="mt-2">You agree not to use, or permit any Third Party to use, the Platform for any illegal, fraudulent or improper purposes, or to post, upload, or submit any content that is offensive, abusive, defamatory, misleading, or otherwise unlawful.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">5. DATA ACCURACY AND USER CONTENT</h2>
            <p>You acknowledge and agree that:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>You are solely responsible for the accuracy, quality, and legality of data You enter into the Platform</li>
              <li>The Platform does not verify the accuracy of maintenance records, schedules, or any other user-provided information</li>
              <li>Any decisions made based on information stored in the Platform are made at Your own risk</li>
              <li>The Platform is not a substitute for professional marine maintenance advice, inspections, or surveys</li>
              <li>Captain's Log accepts no responsibility for the seaworthiness, safety, or operational condition of any vessel</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">6. CONTENT OWNERSHIP AND INTELLECTUAL PROPERTY</h2>
            <p>
              Captain's Log undertakes that the services provided to You through the Platform shall not infringe or violate any intellectual property rights, proprietary rights, or other rights of any Third Party under applicable law.
            </p>
            <p className="mt-2">
              You retain ownership of any content You submit to the Platform, but grant Captain's Log a worldwide, non-exclusive, royalty-free licence to host, display, store, and process such content solely for the purpose of providing the Platform services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">7. PRIVACY POLICY AND DATA PROTECTION</h2>
            <p>
              Captain's Log is committed to protecting Your privacy. The collection and use of Personal Data through the Captain's Log App and website are carried out in accordance with these Terms and our <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</Link>.
            </p>
            <p className="mt-2">
              By registering for the Captain's Log Platform, You acknowledge and agree to the processing of Your Personal Data in accordance with these Terms and the Privacy Policy. Captain's Log is subject to the UAE's Federal Decree by Law No. 45 of 2021 Concerning the Protection of Personal Data (as amended) (the "UAE Data Protection Law").
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">8. LIABILITY</h2>
            <p className="font-semibold">
              You acknowledge and agree that Captain's Log acts solely as a maintenance tracking and record-keeping service provider and does not operate as a marine surveyor, inspector, maintenance provider, or professional advisor.
            </p>
            <p className="mt-4">
              TO THE FULLEST EXTENT PERMITTED UNDER APPLICABLE LAWS, CAPTAIN'S LOG SHALL NOT BE LIABLE FOR ANY INDIRECT, CONSEQUENTIAL, INCIDENTAL, PUNITIVE, OR SPECIAL DAMAGES OR LOSSES, INCLUDING BUT NOT LIMITED TO LOSS OF DATA, PROFITS, GOODWILL, OR BUSINESS OPPORTUNITY, ARISING FROM:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Your use or inability to use the Platform</li>
              <li>Your breach of these Terms and Conditions</li>
              <li>Any misrepresentation, fraud, wilful misconduct, omission, or negligence by You</li>
              <li>Any maintenance decisions or actions taken based on data stored in the Platform</li>
              <li>Any physical damage, injury, or harm to persons, vessels, or property</li>
              <li>Any failure of equipment or systems that were tracked using the Platform</li>
              <li>The seaworthiness, safety, or operational condition of any vessel</li>
            </ul>
            <p className="mt-4">
              You shall be solely responsible for safeguarding Your account access credentials. Captain's Log shall not be liable for any losses, whether direct or indirect, arising from unauthorised access, including access obtained through forgery, fraud, wiretapping, interception, theft, or voluntary disclosure of passwords or personal information by You.
            </p>
            <p className="mt-4">
              Captain's Log disclaims all liability for any technical malfunction, disruption, or software failure, including but not limited to Platform downtime, system bugs or glitches, infection by viruses or malicious code, denial-of-service attacks, any damage to Your hardware, software, or data, any unauthorised access, hacking, data breach or information leak, and scheduled or unscheduled server downtime or maintenance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">9. INDEMNITY</h2>
            <p>
              You agree to fully indemnify, defend, and hold harmless Captain's Log, its affiliates, directors, officers, employees, and representatives, from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising directly or indirectly from:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Your use or misuse of the Captain's Log Platform</li>
              <li>Any violation by You of these Terms and Conditions</li>
              <li>Any unauthorised or fraudulent activity conducted through Your account</li>
              <li>Any maintenance or operational decisions made using Platform data</li>
              <li>Any claims arising from the condition, safety, or seaworthiness of any vessel</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">10. UNSCHEDULED DOWNTIME</h2>
            <p>
              In the event of unscheduled maintenance or system downtime, Captain's Log shall, where reasonably practicable, display a notification within the App/Website and notify You via email of the outage and its expected duration.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">11. FORCE MAJEURE</h2>
            <p>
              Captain's Log shall not be liable for any failure or delay in performance of its obligations under these Terms and Conditions where such failure or delay results from events beyond its reasonable control, including but not limited to acts of God, war, terrorism, government actions, pandemics, telecommunications failure, or power outages. In such event, Captain's Log shall use reasonable endeavours to mitigate the effect of the force majeure event.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">12. SEVERABILITY</h2>
            <p>
              If any provision of these Terms and Conditions is found to be invalid, unlawful, or unenforceable under applicable law, such provision shall be severed from the remaining provisions, which shall remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">13. ENTIRE AGREEMENT</h2>
            <p>
              These Terms and Conditions, together with the Privacy Policy, constitute the entire agreement between You and Captain's Log in relation to the use of the Platform and services, and supersede any prior agreements or understandings, whether written or oral.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">14. TERMINATION AND SUSPENSION</h2>
            <p>Captain's Log reserves the right to block, suspend, or restrict access to any account or service under the Platform, where:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>The End-User is found to be engaged in suspicious or unlawful activities</li>
              <li>There is a violation of applicable UAE laws, regulations, or these Terms and Conditions</li>
            </ul>
            <p className="mt-4">
              Captain's Log may, at its sole discretion, revise or amend these Terms and Conditions at any time by updating this document and notifying You of the changes. Your continued use of the App after such notification shall constitute Your acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">15. GOVERNING LAW AND DISPUTE RESOLUTION</h2>
            <p>
              These Terms and Conditions shall be governed by and construed in accordance with the laws of the United Arab Emirates. In the event of any dispute, You and Captain's Log shall first seek to resolve the matter amicably through good-faith discussions. If the dispute cannot be resolved within thirty (30) days of written notice, it shall be submitted to the exclusive jurisdiction of the Dubai Courts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">16. CUSTOMER SUPPORT</h2>
            <p>
              If You have any complaints or concerns regarding the Captain's Log Platform or the services provided, You may contact Captain's Log at <a href="mailto:support@captainlog.ae" className="text-blue-600 dark:text-blue-400 hover:underline">support@captainlog.ae</a>. Captain's Log will acknowledge receipt of Your complaint within five (5) Business Days and will endeavour to provide a resolution within twenty (20) Business Days, subject to the nature and complexity of the matter.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: February 1, 2025
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            <strong>Disclaimer:</strong> Captain's Log is a maintenance tracking platform only. All maintenance records and data are provided by users and are offered strictly "as is." Captain's Log is not responsible for any maintenance decisions or vessel conditions. See our <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</Link> for details.
          </p>
        </div>
      </div>
    </div>
  );
}
