import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen flex flex-col">
            <ScrollToTop />
            <Header />
            <main className="flex-grow pt-32 pb-20">
                <div className="luxury-container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl md:text-5xl font-serif mb-8 text-center">Privacy Policy</h1>
                    <div className="prose prose-lg prose-headings:font-serif prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground max-w-none">
                        <p className="lead">
                            At Jungle Heritage Resort, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy outlines how we collect, use, and safeguard your data.
                        </p>

                        <h3>1. Information We Collect</h3>
                        <p>
                            We collect information that you provide directly to us when you make a reservation, subscribe to our newsletter, or contact us. This may include your name, email address, phone number, payment information, and any special requests or preferences.
                        </p>

                        <h3>2. How We Use Your Information</h3>
                        <p>
                            We use the information we collect to:
                        </p>
                        <ul>
                            <li>Process your reservations and payments.</li>
                            <li>Communicate with you regarding your stay and special offers.</li>
                            <li>Improve our services and guest experience.</li>
                            <li>Comply with legal obligations.</li>
                        </ul>

                        <h3>3. Data Security</h3>
                        <p>
                            We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. However, please note that no method of transmission over the internet or electronic storage is 100% secure.
                        </p>

                        <h3>4. Cookies</h3>
                        <p>
                            Our website uses cookies to enhance your browsing experience and analyze site traffic. You can choose to disable cookies through your browser settings, but this may affect certain functionalities of our website.
                        </p>

                        <h3>5. Third-Party Services</h3>
                        <p>
                            We may share your information with trusted third-party service providers who assist us in operating our website, conducting our business, or servicing you, so long as those parties agree to keep this information confidential.
                        </p>

                        <h3>6. Changes to This Policy</h3>
                        <p>
                            We reserve the right to update or modify this Privacy Policy at any time. Any changes will be posted on this page with an updated effective date.
                        </p>

                        <h3>7. Contact Us</h3>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at <a href="mailto:reservation@jungleheritage.in">reservation@jungleheritage.in</a>.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
