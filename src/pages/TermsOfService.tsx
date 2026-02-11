const TermsOfService = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="font-display text-3xl lg:text-4xl font-bold mb-2">Terms of Service</h1>
      <p className="text-muted-foreground mb-8">Last updated: February 11, 2026</p>

      <div className="prose prose-sm max-w-none space-y-8 text-foreground">
        <section>
          <h2 className="font-display text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing or using the Abolore Couture website and services, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you may not access or use our services. These terms apply to all visitors, users, and customers of our platform.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">2. Products & Pricing</h2>
          <p className="text-muted-foreground leading-relaxed">
            All products listed on Abolore Couture are subject to availability. We reserve the right to modify pricing, discontinue products, or limit quantities at any time without prior notice. Prices are displayed in Nigerian Naira (₦) and are inclusive of applicable taxes unless otherwise stated. While we make every effort to display accurate product descriptions and images, slight variations may occur due to photography and screen display differences.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">3. Orders & Payment</h2>
          <p className="text-muted-foreground leading-relaxed">
            When you place an order, you are making an offer to purchase the selected items. We reserve the right to accept or decline any order. Payment must be completed at the time of order placement or upon delivery, depending on the chosen payment method. We accept bank transfers, card payments, and cash on delivery for eligible orders. All transactions are processed securely, and your financial information is protected in accordance with industry standards.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">4. Shipping & Delivery</h2>
          <p className="text-muted-foreground leading-relaxed">
            Abolore Couture delivers across Nigeria. Delivery fees vary based on your location and are calculated at checkout. Estimated delivery times are provided as guidelines and may vary due to factors beyond our control, including weather, logistics, and public holidays. We are not liable for delays caused by third-party delivery services. You will receive tracking information once your order has been dispatched.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">5. Returns & Exchanges</h2>
          <p className="text-muted-foreground leading-relaxed">
            We want you to be completely satisfied with your purchase. Items may be returned or exchanged within 7 days of delivery, provided they are in their original condition with all tags attached and packaging intact. Certain items, including undergarments, swimwear, and customised pieces, are not eligible for return. Return shipping costs are the responsibility of the customer unless the item is defective or incorrect. Refunds will be processed within 5–10 business days of receiving the returned item.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">6. User Accounts</h2>
          <p className="text-muted-foreground leading-relaxed">
            To access certain features, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information during registration and to update your details as needed. We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activity.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">7. Intellectual Property</h2>
          <p className="text-muted-foreground leading-relaxed">
            All content on this website, including but not limited to text, images, logos, designs, and graphics, is the property of Abolore Couture and is protected by Nigerian and international copyright and trademark laws. You may not reproduce, distribute, modify, or create derivative works from any content without our prior written consent.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">8. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            Abolore Couture shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our website or products. Our total liability for any claim related to our services shall not exceed the amount you paid for the specific product or service in question. We are not responsible for any loss of data, revenue, or profits resulting from the use of our platform.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">9. Governing Law</h2>
          <p className="text-muted-foreground leading-relaxed">
            These Terms of Service shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising from these terms shall be resolved through negotiation, and if necessary, through the courts of competent jurisdiction in Ibadan, Oyo State, Nigeria.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">10. Changes to Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            We reserve the right to update or modify these Terms of Service at any time. Changes will be effective immediately upon posting to this page. Your continued use of our services after any changes constitutes acceptance of the revised terms. We encourage you to review this page periodically.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions about these Terms of Service, please contact us at{" "}
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

export default TermsOfService;
