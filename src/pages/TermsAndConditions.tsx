import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

export default function TermsAndConditions() {
    return (
        <div className="min-h-screen flex flex-col">
            <ScrollToTop />
            <Header />
            <main className="flex-grow pt-32 pb-20">
                <div className="luxury-container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl md:text-5xl font-serif mb-8 text-center">Terms & Conditions</h1>
                    <div className="prose prose-lg prose-headings:font-serif prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground max-w-none">
                        <p className="lead">
                            Welcome to Jungle Heritage Resort. By accessing our website and using our services, you agree to comply with and be bound by the following terms and conditions.
                        </p>

                        <h3>1. Booking & Reservations</h3>
                        <p>
                            All reservations are subject to availability and confirmation. A valid credit card or advance payment is required to guarantee your booking.
                        </p>
                        <ul>
                            <li>Check-in time is 12:00 PM.</li>
                            <li>Check-out time is 11:00 AM.</li>
                            <li>Valid government-issued ID is required at check-in for all guests.</li>
                        </ul>

                        <h3>2. Cancellation Policy</h3>
                        <p>
                            Cancellations made more than 7 days prior to arrival will receive a full refund. Cancellations made within 7 days of arrival may be subject to a cancellation fee equivalent to one night's stay. No-shows will be charged the full amount of the reservation.
                        </p>

                        <h3>3. Resort Rules</h3>
                        <p>
                            To ensure a pleasant stay for all guests, we ask that you respect the following rules:
                        </p>
                        <ul>
                            <li>Smoking is prohibited in all indoor areas.</li>
                            <li>Pets are not allowed unless specifically arranged in advance.</li>
                            <li>Quiet hours are from 10:00 PM to 7:00 AM.</li>
                            <li>Respect the local wildlife and environment.</li>
                        </ul>

                        <h3>4. Liability</h3>
                        <p>
                            Jungle Heritage Resort is not liable for any loss, damage, or injury sustained by guests or their property during their stay, except where such liability is imposed by law. Guests are responsible for their own safety and security.
                        </p>

                        <h3>5. Changes to Terms</h3>
                        <p>
                            We reserve the right to modify these terms and conditions at any time without prior notice. Continued use of our services constitutes acceptance of the modified terms.
                        </p>

                        <h3>6. Governing Law</h3>
                        <p>
                            These terms and conditions are governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the courts in [Local Jurisdiction].
                        </p>

                        <h3>7. Contact Information</h3>
                        <p>
                            If you have any questions or concerns regarding these terms, please contact us at <a href="mailto:reservation@jungleheritage.in">reservation@jungleheritage.in</a>.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
