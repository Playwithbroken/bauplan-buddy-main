import React from 'react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-gray-600 mb-8">Last updated: October 30, 2024</p>

      <div className="prose prose-sm max-w-none">
        <h2>1. Introduction</h2>
        <p>
          BauplanBuddy GmbH ("we," "us," "our," or "Company") is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, disclose, and otherwise process personal data
          in connection with our website and services.
        </p>

        <h2>2. Legal Basis (DSGVO Art. 6)</h2>
        <p>We process personal data based on:</p>
        <ul>
          <li>
            <strong>Consent (Art. 6(1)(a)):</strong> Marketing communications, analytics, optional
            features
          </li>
          <li>
            <strong>Contract (Art. 6(1)(b)):</strong> Service provision, billing, support
          </li>
          <li>
            <strong>Legal Obligation (Art. 6(1)(c)):</strong> Tax records, accounting, compliance
          </li>
          <li>
            <strong>Legitimate Interests (Art. 6(1)(f)):</strong> Security, fraud prevention, analytics
          </li>
        </ul>

        <h2>3. Data We Collect</h2>

        <h3>3.1 Personal Information You Provide</h3>
        <ul>
          <li>Name, email address, phone number</li>
          <li>Company information and job title</li>
          <li>Account credentials and preferences</li>
          <li>Project, quote, and invoice data</li>
          <li>Support tickets and communications</li>
        </ul>

        <h3>3.2 Automatically Collected Information</h3>
        <ul>
          <li>IP address and browser type</li>
          <li>Pages visited and time spent</li>
          <li>Referrer information</li>
          <li>Device type and operating system</li>
          <li>Cookies and tracking pixels</li>
        </ul>

        <h2>4. Data Usage</h2>
        <p>We use your data to:</p>
        <ul>
          <li>Provide and improve our services</li>
          <li>Process payments and handle billing</li>
          <li>Send account notifications and updates</li>
          <li>Provide customer support</li>
          <li>Conduct analytics and improve UX</li>
          <li>Comply with legal obligations</li>
          <li>Prevent fraud and enhance security</li>
        </ul>

        <h2>5. Data Sharing</h2>
        <p>
          We do NOT sell your data. We may share data with:
        </p>
        <ul>
          <li>
            <strong>Service Providers:</strong> Payment processors (Stripe), hosting providers
            (AWS), analytics tools
          </li>
          <li>
            <strong>Legal Requirements:</strong> When required by law or court order
          </li>
          <li>
            <strong>Business Transfers:</strong> In case of merger or acquisition
          </li>
        </ul>

        <h2>6. Data Retention</h2>
        <p>
          We retain personal data for as long as necessary to provide services:
        </p>
        <ul>
          <li>Active accounts: During the service period + 30 days after cancellation</li>
          <li>Billing records: 7 years (German tax requirements)</li>
          <li>Audit logs: 2 years</li>
          <li>Analytics: 13 months (Google Analytics default)</li>
          <li>Cookies: As configured (see Cookie Policy)</li>
        </ul>

        <h2>7. Your Rights (DSGVO Chapter III)</h2>

        <h3>7.1 Right to Access (Art. 15)</h3>
        <p>
          You have the right to obtain confirmation of whether your data is being processed and to
          access your data. We provide a data export in JSON/CSV format within 30 days.
        </p>

        <h3>7.2 Right to Rectification (Art. 16)</h3>
        <p>
          You can correct inaccurate data via your account settings or by contacting us.
        </p>

        <h3>7.3 Right to Erasure (Art. 17)</h3>
        <p>
          You can request deletion of your account and data. We will delete within 30 days, except
          where retention is required by law.
        </p>

        <h3>7.4 Right to Restrict Processing (Art. 18)</h3>
        <p>
          You can restrict processing of your data while we investigate disputes.
        </p>

        <h3>7.5 Right to Data Portability (Art. 20)</h3>
        <p>
          You can request your data in a portable format (JSON/CSV) to transfer to another provider.
        </p>

        <h3>7.6 Right to Object (Art. 21)</h3>
        <p>
          You can object to marketing communications and certain processing activities.
        </p>

        <h3>7.7 Right to Lodge a Complaint (Art. 77)</h3>
        <p>
          You have the right to lodge a complaint with your local data protection authority:
        </p>
        <ul>
          <li>
            <strong>Germany:</strong> Bundesbeauftragte für Datenschutz und Informationsfreiheit
          </li>
          <li>
            <strong>EU:</strong> Your national DPA (see{' '}
            <a href="https://edpb.ec.europa.eu/about-edpb/board/members_en">EDPB members</a>)
          </li>
        </ul>

        <h2>8. International Transfers</h2>
        <p>
          If data is transferred outside the EU/EEA, we use Standard Contractual Clauses (SCCs) or
          adequacy decisions as approved by the European Commission.
        </p>

        <h2>9. Security</h2>
        <p>
          We implement technical and organizational measures to protect your data:
        </p>
        <ul>
          <li>AES-256 encryption at rest</li>
          <li>TLS 1.3 encryption in transit</li>
          <li>Password hashing with bcryptjs (salt rounds 12)</li>
          <li>Regular security audits and penetration testing</li>
          <li>Access controls and authentication</li>
          <li>Incident response procedures</li>
        </ul>

        <h2>10. Contact Information</h2>
        <p>
          For privacy inquiries, data requests, or complaints:
        </p>
        <div className="bg-gray-50 p-4 rounded">
          <p>
            <strong>BauplanBuddy GmbH</strong>
            <br />
            Data Protection Officer
            <br />
            Email: datenschutz@bauplan-buddy.de
            <br />
            Phone: +49 (0) 30 123456789
            <br />
            Address: Example Street 123, 10115 Berlin, Germany
          </p>
        </div>

        <h2>11. Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. We will notify you of significant changes
          via email or by posting a notice on our website.
        </p>

        <h2>12. Third-Party Services</h2>

        <h3>12.1 Analytics</h3>
        <p>
          We use Google Analytics (opt-in via cookie consent) to understand usage patterns.
          <a href="https://policies.google.com/privacy">Google Privacy Policy</a>
        </p>

        <h3>12.2 Payment Processing</h3>
        <p>
          Payments are processed by Stripe. We do not store credit card data.
          <a href="https://stripe.com/privacy">Stripe Privacy Policy</a>
        </p>

        <h3>12.3 Hosting</h3>
        <p>
          Our services are hosted on AWS in the EU-CENTRAL-1 (Frankfurt) region.
          <a href="https://aws.amazon.com/privacy/">AWS Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};
