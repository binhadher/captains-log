'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
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

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">PRIVACY POLICY</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Last Updated: February 1, 2025</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
          
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">A. INTRODUCTION</h2>
            <p>
              This Privacy Policy (the "Privacy Policy" or "Policy") outlines Captain's Log's commitment to protecting the privacy and personal data of our users and other stakeholders. Captain's Log is operated under the laws of Dubai, United Arab Emirates ("UAE").
            </p>
            <p className="mt-2">
              We recognise the importance of handling personal information responsibly and transparently, and this Policy explains how we collect, use, disclose, and safeguard Personal Data.
            </p>
            <p className="mt-2">
              Please read this Policy carefully as it will help You make informed decisions about sharing Your personal information (i.e. Personal Data) with us.
            </p>
            <p className="mt-2">
              Captain's Log values Your security and privacy and is, for Personal Data Processing, subject to the UAE's Federal Decree by Law No. 45 of 2021 Concerning the Protection of Personal Data (as amended) (the "UAE Data Protection Law"). Captain's Log acts primarily as a Data Controller.
            </p>
            <p className="mt-2">
              In accordance with the UAE Data Protection Law, personal data is any data related to a natural person that can be identified directly or indirectly by linking the data, through the use of identification elements such as their name, voice, image, identification number, electronic identifier, geographical location, or by one or more physical, physiological, economic, cultural or social characteristics ("Personal Data").
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">B. PURPOSE</h2>
            <p>
              This Policy aims to inform Data Subjects (users and stakeholders) associated with Captain's Log on how we deal with the Personal Data that we collect, process, and maintain.
            </p>
            <p className="mt-2">
              The Captain's Log Platform is a boat maintenance tracking and management application that enables You to record maintenance activities, store documents, set service schedules, and manage boat-related information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">1. DATA PROTECTION POLICY - KEY PRINCIPLES (UAE COMPLIANCE)</h2>
            <p>In accordance with the UAE Data Protection Law, Captain's Log protects Personal Data based on the following principles:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Role and Responsibilities:</strong> Captain's Log acts primarily as a Data Controller and complies with the obligations set out under UAE Data Protection Law.</li>
              <li><strong>Lawful Processing:</strong> Captain's Log processes Personal Data strictly in accordance with the UAE Data Protection Law.</li>
              <li><strong>Security Measures:</strong> Captain's Log implements appropriate technical and organisational measures to protect Personal Data from unauthorised access, loss, alteration, or disclosure, in compliance with Article 20 of the UAE Data Protection Law.</li>
              <li><strong>Confidentiality:</strong> All staff are bound by confidentiality obligations.</li>
              <li><strong>Data Subject Rights:</strong> Where Captain's Log receives any request from a Data Subject regarding the exercise of their rights under Articles 13 to 18 of the UAE Data Protection Law, it shall promptly act upon such request.</li>
              <li><strong>Retention and Deletion:</strong> Personal Data is retained only for the duration required by applicable law and will be securely deleted upon termination of the Processing relationship.</li>
              <li><strong>Breach Notification:</strong> Captain's Log shall promptly notify Data Subjects (where applicable) and relevant authorities of any actual or suspected Personal Data breach, as required under Article 9 of the UAE Data Protection Law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">2. WHO IS THE DATA CONTROLLER</h2>
            <p>
              For the purposes of UAE Data Protection Law, Captain's Log acts primarily as a Data Controller in relation to Personal Data it collects directly from Data Subjects. In those cases, Captain's Log determines the purposes and means of Processing and is therefore responsible for ensuring that such Personal Data is processed in compliance with this Privacy Policy and the requirements of the UAE Data Protection Law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">3. INFORMATION CAPTAIN'S LOG COLLECTS</h2>
            <p>Captain's Log collects Personal Data that You voluntarily provide during interactions with us. The methods by which we collect Personal Data include:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Information You provide through the Captain's Log Platform, application forms, whether submitted in physical or electronic form</li>
              <li>Written or electronic communication with Captain's Log, including emails or messages</li>
            </ul>
            <p className="mt-4">
              Captain's Log does not collect Personal Data from individuals under the age of 18. Our services are intended for individuals who can legally enter into contracts. If we become aware that Personal Data from a minor has been provided without parental consent, we will take steps to delete such data promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">4. DATA YOU PROVIDE TO US</h2>
            <p>When You engage with Captain's Log or utilise our services, we may collect certain Personal Data, including but not limited to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Contact and Identification Information:</strong> Your full name, email address, and phone number.</li>
              <li><strong>Account and Profile Information:</strong> Information provided during registration or profile creation.</li>
              <li><strong>Boat Information:</strong> Boat name, make, model, year, registration numbers, and specifications.</li>
              <li><strong>Maintenance Records:</strong> Service logs, dates, costs, descriptions, and related documents You upload.</li>
              <li><strong>Documents:</strong> Files You upload such as registration certificates, insurance documents, and photos.</li>
              <li><strong>Crew Information:</strong> Names and document details of crew members You add.</li>
            </ul>
            <p className="mt-4">
              <strong>Sensitive Personal Data:</strong> Given the nature of our services, Captain's Log does not intentionally collect Sensitive Personal Data, as defined under the UAE Data Protection Law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">5. TRACKING TECHNOLOGIES AND COOKIES</h2>
            <p>
              A Cookie is a small text file stored on Your computer or mobile device browser that helps retain user preferences and enhance Your browsing experience. Captain's Log uses Cookies to track overall website/application usage and to improve functionality and performance.
            </p>
            <p className="mt-2">Captain's Log uses the following types of Cookies:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Essential Cookies:</strong> These cookies are used for technical reasons to enable the website to work efficiently.</li>
              <li><strong>Functional Cookies:</strong> These cookies are used to remember the choices You make when using our Website/App, to provide You with a more personalised experience.</li>
            </ul>
            <p className="mt-4">
              You can manage and disable Cookies through the settings of Your preferred browser. Most web browsers are set to accept cookies by default. If You prefer, You can usually choose to set Your browser to remove or reject cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">6. FOR WHAT PURPOSES DOES CAPTAIN'S LOG USE YOUR PERSONAL DATA</h2>
            <p>Depending on Your type of interaction with Captain's Log, we may utilise Your Personal Data for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Creating or registering Your customer accounts on our Platform</li>
              <li>Provision of Captain's Log services: allowing You to access our maintenance tracking features</li>
              <li>Sending service-related notifications and maintenance reminders</li>
              <li>Facilitating communication with Captain's Log via email or other channels</li>
              <li>Maintaining and operating the Platform and related communication channels</li>
              <li>Compliance with legal obligations</li>
              <li>Data analysis and improving the Platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">7. HOW DO WE COLLECT AND PROCESS INFORMATION</h2>
            <p>We collect Personal Data by various means, including the Captain's Log Platform, email, and other electronic communication.</p>
            <p className="mt-2">We will:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Process Your Personal Data in a lawful, fair, transparent, and secure way</li>
              <li>Collect Your Personal Data only for specific, explicit, and legitimate purposes</li>
              <li>Not use Your Personal Data in a way that is incompatible with those purposes</li>
              <li>Process Your Personal Data in a manner that is adequate and relevant</li>
              <li>Keep Your Personal Data accurate and up to date</li>
              <li>Keep Your Personal Data only as long as necessary for the purposes informed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">8. DISCLOSURE / SHARING OF YOUR INFORMATION</h2>
            <p>Captain's Log may disclose or share Your Personal Data in the following circumstances, in accordance with the UAE Data Protection Law:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>With Service Providers:</strong> We may share Your Personal Data with trusted Third-Party service providers who perform services on our behalf (e.g., cloud hosting). These providers are contractually obligated to process Your data only under Captain's Log's instructions.</li>
              <li><strong>With Your Consent:</strong> Where required, we will only disclose Your Personal Data with Your explicit consent.</li>
              <li><strong>Where required or permitted by law:</strong> We may disclose Your Personal Data to comply with applicable laws, court orders, or regulatory obligations; detect, investigate, or prevent fraud or unlawful activities; or protect the rights, property, or safety of Captain's Log, our users, or others.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">9. LEGAL BASIS FOR COLLECTING AND PROCESSING PERSONAL DATA</h2>
            <p>Captain's Log processes Personal Data strictly in accordance with the lawful bases set out under Articles 4, 5 and 6 of the UAE Data Protection Law. Depending on the context, we may rely on:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Your explicit consent:</strong> Where required, we will request Your clear and informed consent. You may withdraw Your consent at any time.</li>
              <li><strong>Contractual necessity:</strong> Where Processing is necessary for the performance of a contract to which You are a party.</li>
              <li><strong>Legal or regulatory obligation:</strong> Where we are required to process Your Personal Data to comply with UAE laws.</li>
              <li><strong>Legitimate Interests:</strong> Where Processing is necessary for the legitimate interests of Captain's Log and such interests are not overridden by Your fundamental rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">10. INFORMATION STORAGE</h2>
            <p>
              The Personal Data we collect from You is securely stored on Captain's Log's databases which are hosted on secure servers. We implement appropriate technical and organisational measures to protect Your Personal Data against unauthorised access, alteration, disclosure, or destruction, in accordance with the UAE Data Protection Law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">11. DATA RETENTION</h2>
            <p>
              Your Personal Data is retained only for the duration necessary to fulfil the purposes outlined in this Privacy Policy, including for the purposes of satisfying any accounting, tax, auditing, or reporting requirements and to comply with any legal obligations.
            </p>
            <p className="mt-2">
              In general, we may retain Your Personal Data for any minimum retention period stipulated by applicable UAE laws or regulations, and for any further period necessary for the designated purpose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">12. DATA DESTRUCTION</h2>
            <p>
              Upon the cessation of the purpose for which Your Personal Data was collected and retained, and once all legal, regulatory, or contractual obligations have been fulfilled, Captain's Log will securely destroy or permanently anonymise such data in accordance with its internal data retention and destruction policies.
            </p>
            <p className="mt-2">
              If You wish to request the deletion of Your Personal Data, You may do so by contacting us at <a href="mailto:support@captainlog.ae" className="text-blue-600 dark:text-blue-400 hover:underline">support@captainlog.ae</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">13. DATA SECURITY</h2>
            <p>
              Captain's Log takes the security of Your Personal Data seriously and has implemented appropriate technical and organisational measures in accordance with the UAE Data Protection Law to protect Your Personal Data. These safeguards include:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Adopting internal data governance policies and procedures</li>
              <li>Implementing data security technologies such as encryption and access controls</li>
              <li>Ensuring contractual safeguards with all service providers</li>
              <li>Monitoring our platforms using security frameworks</li>
              <li>Delivering ongoing data protection training to personnel</li>
            </ul>
            <p className="mt-4">
              While we take all reasonable precautions, no method of data transmission or storage is entirely secure. Therefore, we cannot guarantee the absolute security of Personal Data transmitted to us via the internet, and any such transmission is at Your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">14. DATA BREACH RESPONSE</h2>
            <p>
              A data breach occurs when there is unauthorised access to, or loss, alteration, disclosure, or destruction of, Personal Data. If Captain's Log becomes aware of an actual or suspected Personal Data breach, we will promptly investigate the incident, determine its scope, and take immediate steps to contain and mitigate any potential harm.
            </p>
            <p className="mt-2">
              In accordance with Article 9 of the UAE Data Protection Law, Captain's Log will notify the Data Protection Bureau as soon as practicable after becoming aware of any Personal Data breach. Where the breach is likely to result in high risk to the security or rights of a Data Subject, Captain's Log will also notify the affected Data Subjects without undue delay.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">15. YOUR RIGHTS</h2>
            <p>As a Data Subject under the UAE Data Protection Law, You are entitled to exercise the following rights:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Right to information:</strong> To be informed about the collection and use of Your Personal Data</li>
              <li><strong>Right to access:</strong> To request and receive a copy of Your Personal Data</li>
              <li><strong>Right to rectification:</strong> To request correction of inaccurate or incomplete data</li>
              <li><strong>Right to erasure:</strong> To request deletion of Your Personal Data in certain circumstances</li>
              <li><strong>Right to Data Portability:</strong> To receive Your Personal Data in a machine-readable format</li>
              <li><strong>Right to restriction:</strong> To request limitation of Processing of Your Personal Data</li>
              <li><strong>Right to Object:</strong> To object to Processing of Your Personal Data</li>
              <li><strong>Right to withdraw Consent:</strong> To withdraw consent at any time where Processing is based on consent</li>
              <li><strong>Right to file Complaint:</strong> To submit complaints to the UAE Data Bureau if You believe Your data has been processed in violation of the UAE Data Protection Law</li>
            </ul>
            <p className="mt-4">
              To exercise any of these rights, contact us at <a href="mailto:support@captainlog.ae" className="text-blue-600 dark:text-blue-400 hover:underline">support@captainlog.ae</a>. There is no fee to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">16. CHANGES TO THIS PRIVACY POLICY</h2>
            <p>
              Captain's Log may update this Privacy Policy from time to time to reflect changes in our data Processing practices, legal obligations, or business operations. Where material changes are made, we will endeavour to provide reasonable notice.
            </p>
            <p className="mt-2">
              Continued use of the Captain's Log Platform following the publication of updates constitutes Your acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">17. CONTACT US</h2>
            <p>
              If You have any questions, concerns, or requests regarding this Privacy Policy or our data protection practices, please contact us at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong> <a href="mailto:support@captainlog.ae" className="text-blue-600 dark:text-blue-400 hover:underline">support@captainlog.ae</a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: February 1, 2025
          </p>
        </div>
      </div>
    </div>
  );
}
