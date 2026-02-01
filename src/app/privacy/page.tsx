'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
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

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Effective Date: {effectiveDate}</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
          
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">1. Introduction</h2>
            <p>
              {companyName} ("we," "our," or "us") respects your privacy and is committed to protecting your personal 
              data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when 
              you use {appName} ("the Service").
            </p>
            <p className="mt-4">
              By using the Service, you consent to the data practices described in this Privacy Policy. If you do not 
              agree with this Privacy Policy, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">2.1 Information You Provide</h3>
            <p>We collect information you voluntarily provide, including:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Account Information:</strong> Name, email address, and authentication credentials</li>
              <li><strong>Boat Information:</strong> Boat name, make, model, year, registration numbers, and specifications</li>
              <li><strong>Maintenance Records:</strong> Service logs, dates, costs, descriptions, and related documents</li>
              <li><strong>Documents:</strong> Files you upload such as registration certificates, insurance documents, and photos</li>
              <li><strong>Crew Information:</strong> Names and document details of crew members you add</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">2.2 Automatically Collected Information</h3>
            <p>We automatically collect certain information when you use the Service:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Device information (browser type, operating system)</li>
              <li>Log data (access times, pages viewed, IP address)</li>
              <li>Usage patterns and feature interactions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process and store your maintenance records and documents</li>
              <li>Send service-related notifications and reminders</li>
              <li>Respond to your inquiries and support requests</li>
              <li>Monitor and analyze usage patterns to improve user experience</li>
              <li>Protect against unauthorized access and ensure security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">4. Data Storage and Security</h2>
            <p>
              Your data is stored securely using industry-standard cloud infrastructure providers. We implement 
              appropriate technical and organizational measures to protect your personal data against unauthorized 
              access, alteration, disclosure, or destruction, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication mechanisms</li>
              <li>Regular security assessments</li>
              <li>Access controls and monitoring</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we 
              strive to protect your personal data, we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">5. Data Sharing and Disclosure</h2>
            <p>We do not sell your personal data. We may share your information only in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Service Providers:</strong> With third-party vendors who assist in operating the Service 
                (e.g., cloud hosting, authentication services), under strict confidentiality agreements</li>
              <li><strong>Legal Requirements:</strong> When required by law, regulation, legal process, or governmental request</li>
              <li><strong>Protection of Rights:</strong> To protect the rights, property, or safety of {companyName}, 
                our users, or others</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, 
                where your data may be transferred to the successor entity</li>
              <li><strong>With Your Consent:</strong> When you have given explicit consent to share specific information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">6. Data Retention</h2>
            <p>
              We retain your personal data for as long as your account is active or as needed to provide the Service. 
              After account termination, we may retain certain data for:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Compliance with legal obligations</li>
              <li>Resolution of disputes</li>
              <li>Enforcement of agreements</li>
              <li>Backup and disaster recovery purposes (for a limited period)</li>
            </ul>
            <p className="mt-4">
              You may request deletion of your data at any time by contacting us at {contactEmail}.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">7. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the following rights:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data</li>
              <li><strong>Data Portability:</strong> Request a copy of your data in a machine-readable format</li>
              <li><strong>Objection:</strong> Object to certain processing of your data</li>
              <li><strong>Withdrawal of Consent:</strong> Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, please contact us at {contactEmail}. We will respond to your request within 
              30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">8. Cookies and Tracking</h2>
            <p>
              We use essential cookies and similar technologies to operate the Service, maintain your session, and 
              remember your preferences. We do not use cookies for advertising or tracking purposes across third-party 
              websites.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">9. Third-Party Services</h2>
            <p>
              The Service may integrate with third-party services (e.g., authentication providers, cloud storage). 
              These services have their own privacy policies, and we encourage you to review them. We are not 
              responsible for the privacy practices of third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">10. Children's Privacy</h2>
            <p>
              The Service is not intended for use by individuals under the age of 18. We do not knowingly collect 
              personal data from children. If you believe a child has provided us with personal data, please contact 
              us at {contactEmail}, and we will delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">11. International Data Transfers</h2>
            <p>
              Your data may be transferred to and processed in countries other than your country of residence. These 
              countries may have different data protection laws. By using the Service, you consent to such transfers. 
              We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by 
              posting the new Privacy Policy on this page and updating the "Effective Date." Your continued use of 
              the Service after such changes constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">13. Contact Us</h2>
            <p>
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong> {contactEmail}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">14. Governing Law</h2>
            <p>
              This Privacy Policy is governed by the laws of {jurisdiction}. Any disputes relating to this Privacy 
              Policy shall be subject to the exclusive jurisdiction of the courts of {jurisdiction}.
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
