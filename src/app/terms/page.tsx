'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  const effectiveDate = 'February 1, 2025';
  const appName = "Captain's Log";
  const companyName = 'Captain\'s Log';
  const contactEmail = 'support@captainlog.ae';
  const jurisdiction = 'United Arab Emirates';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Terms of Service</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Effective Date: {effectiveDate}</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
          
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using {appName} ("the Service"), you agree to be bound by these Terms of Service ("Terms"). 
              If you do not agree to these Terms, you may not access or use the Service. Your continued use of the Service 
              constitutes acceptance of any updates or modifications to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">2. Description of Service</h2>
            <p>
              {appName} is a boat maintenance tracking and management application that allows users to log maintenance 
              activities, track service schedules, store documents, and manage boat-related information. The Service is 
              provided "as is" for informational and organizational purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">3. User Accounts and Responsibilities</h2>
            <p>You are responsible for:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Ensuring the accuracy and completeness of all information you provide</li>
              <li>Complying with all applicable laws and regulations</li>
              <li>Using the Service only for lawful purposes related to boat maintenance and management</li>
            </ul>
            <p className="mt-4">
              You agree not to use the Service to store, transmit, or distribute any content that is illegal, harmful, 
              threatening, abusive, defamatory, or otherwise objectionable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">4. Data Accuracy and User Content</h2>
            <p>
              You acknowledge and agree that:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>You are solely responsible for the accuracy, quality, and legality of data you enter into the Service</li>
              <li>The Service does not verify the accuracy of maintenance records, schedules, or any other user-provided information</li>
              <li>Any decisions made based on information stored in the Service are made at your own risk</li>
              <li>The Service is not a substitute for professional marine maintenance advice or inspections</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">5. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are owned by {companyName} and are 
              protected by international copyright, trademark, and other intellectual property laws. You retain 
              ownership of any content you submit to the Service, but grant us a license to use, store, and display 
              such content solely for the purpose of providing the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">6. Disclaimer of Warranties</h2>
            <p className="font-semibold">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR 
              IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>IMPLIED WARRANTIES OF MERCHANTABILITY</li>
              <li>FITNESS FOR A PARTICULAR PURPOSE</li>
              <li>NON-INFRINGEMENT</li>
              <li>ACCURACY, RELIABILITY, OR COMPLETENESS OF ANY INFORMATION</li>
              <li>UNINTERRUPTED OR ERROR-FREE OPERATION</li>
            </ul>
            <p className="mt-4">
              We do not warrant that the Service will meet your requirements, that defects will be corrected, or that 
              the Service is free of viruses or other harmful components.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">7. Limitation of Liability</h2>
            <p className="font-semibold">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, {companyName.toUpperCase()}, ITS OFFICERS, DIRECTORS, 
              EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Any loss of profits, revenue, data, or business opportunities</li>
              <li>Any damages arising from your use or inability to use the Service</li>
              <li>Any damages resulting from unauthorized access to your data</li>
              <li>Any damages arising from maintenance decisions made based on Service data</li>
              <li>Any physical damage, injury, or harm to persons, vessels, or property</li>
              <li>Any failure of equipment or systems that were tracked using the Service</li>
            </ul>
            <p className="mt-4">
              IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID TO US, IF ANY, IN THE TWELVE (12) 
              MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">8. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless {companyName}, its officers, directors, employees, 
              agents, and affiliates from and against any claims, damages, obligations, losses, liabilities, costs, 
              or expenses (including attorney's fees) arising from:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Any content you submit to the Service</li>
              <li>Any maintenance or operational decisions made using Service data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">9. Service Modifications and Termination</h2>
            <p>
              We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time, 
              with or without notice. We may also terminate or suspend your account at our sole discretion, without 
              prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or 
              third parties, or for any other reason.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">10. Data Retention and Deletion</h2>
            <p>
              Upon termination of your account, we may retain your data for a reasonable period for backup, archival, 
              or audit purposes. You may request deletion of your data by contacting us at {contactEmail}. We will 
              make reasonable efforts to delete your data within 30 days of such request, except where retention is 
              required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">11. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of {jurisdiction}, without 
              regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the 
              Service shall be resolved exclusively in the courts of {jurisdiction}. You consent to the personal 
              jurisdiction of such courts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">12. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision shall be 
              limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain 
              in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">13. Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and 
              {companyName} regarding the Service and supersede all prior agreements and understandings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">14. Contact Information</h2>
            <p>
              For questions about these Terms, please contact us at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong> {contactEmail}
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {effectiveDate}
          </p>
        </div>
      </div>
    </div>
  );
}
