const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="font-display text-3xl lg:text-4xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">Last updated: February 11, 2026</p>

      <div className="prose prose-sm max-w-none space-y-8 text-foreground">
        <section>
          <h2 className="font-display text-xl font-semibold mb-3">1. Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            At Abolore Couture, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, store, and protect your data when you interact with our website and services. By using our platform, you consent to the practices described in this policy.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">2. Information We Collect</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            We collect the following types of information to provide and improve our services:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li><strong className="text-foreground">Personal Information:</strong> Name, email address, phone number, and delivery address provided during account registration or checkout.</li>
            <li><strong className="text-foreground">Order Information:</strong> Details of your purchases, payment method preferences, and transaction history.</li>
            <li><strong className="text-foreground">Account Data:</strong> Login credentials, profile preferences, and communication preferences.</li>
            <li><strong className="text-foreground">Usage Data:</strong> Information about how you browse and interact with our website, including pages visited and products viewed.</li>
            <li><strong className="text-foreground">Device Information:</strong> Browser type, operating system, IP address, and device identifiers collected automatically when you access our site.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">3. How We Use Your Information</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            We use the information we collect for the following purposes:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Processing and fulfilling your orders, including delivery and payment processing.</li>
            <li>Managing your account and providing customer support.</li>
            <li>Sending order confirmations, shipping updates, and delivery notifications.</li>
            <li>Personalising your shopping experience and recommending products you may enjoy.</li>
            <li>Improving our website, products, and services based on usage patterns.</li>
            <li>Communicating promotional offers and updates, where you have opted in to receive them.</li>
            <li>Detecting and preventing fraud, unauthorised access, and other security threats.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">4. Information Sharing</h2>
          <p className="text-muted-foreground leading-relaxed">
            We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances: with trusted delivery partners to fulfil your orders; with payment processors to complete transactions securely; with service providers who assist us in operating our website and business, subject to confidentiality agreements; and when required by law, regulation, or legal process.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">5. Data Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            We implement industry-standard security measures to protect your personal information from unauthorised access, alteration, disclosure, or destruction. These include encrypted data transmission, secure server infrastructure, and regular security assessments. However, no method of electronic storage or transmission is completely secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">6. Cookies & Tracking</h2>
          <p className="text-muted-foreground leading-relaxed">
            Our website uses cookies and similar technologies to enhance your browsing experience, remember your preferences, and analyse site traffic. You can control cookie settings through your browser preferences. Disabling cookies may limit certain features of our website. We do not use cookies to collect personally identifiable information without your consent.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">7. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            You have the following rights regarding your personal data:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li><strong className="text-foreground">Access:</strong> You may request a copy of the personal data we hold about you.</li>
            <li><strong className="text-foreground">Correction:</strong> You may request correction of inaccurate or incomplete data.</li>
            <li><strong className="text-foreground">Deletion:</strong> You may request deletion of your personal data, subject to legal and operational requirements.</li>
            <li><strong className="text-foreground">Opt-Out:</strong> You may unsubscribe from marketing communications at any time by contacting us or using the unsubscribe link in our emails.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">8. Data Retention</h2>
          <p className="text-muted-foreground leading-relaxed">
            We retain your personal information for as long as necessary to fulfil the purposes outlined in this policy, comply with legal obligations, resolve disputes, and enforce our agreements. Order and transaction records are retained for a minimum of six years in accordance with Nigerian tax and commerce regulations.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">9. Children's Privacy</h2>
          <p className="text-muted-foreground leading-relaxed">
            Our services are not directed to individuals under the age of 13. We do not knowingly collect personal information from children. If you believe we have inadvertently collected data from a minor, please contact us immediately so we can take appropriate action.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">10. Changes to This Policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. Any updates will be posted on this page with a revised "Last updated" date. We encourage you to review this policy periodically to stay informed about how we protect your information.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us at{" "}
            <a href="mailto:abolorecouture@gmail.com" className="text-primary hover:underline">
              abolorecouture@gmail.com
            </a>{" "}
            or call{" "}
            <a href="tel:+2348022050740" className="text-primary hover:underline">
              +2348022050740
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
