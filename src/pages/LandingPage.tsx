/**
 * Landing Page - Marketing & Sign-up
 * For customer acquisition
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedHero } from "@/components/landing/AnimatedHero";
import { Feature3DCard } from "@/components/landing/Feature3DCard";
import { VideoShowcase } from "@/components/landing/VideoShowcase";
import { SocialProof } from "@/components/landing/SocialProof";
import { PremiumPricing } from "@/components/landing/PremiumPricing";
import {
  CheckCircle,
  Zap,
  Shield,
  Users,
  TrendingUp,
  FileText,
  Calendar,
  DollarSign,
  Star,
  ArrowRight,
  Check,
  Play,
  ChevronDown,
  Award,
  Target,
  Clock,
  BarChart3,
  MessageSquare,
} from "lucide-react";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const handleGetStarted = () => {
    // Navigate to register with email pre-filled
    navigate(`/register?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                BB
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Bauplan Buddy
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Preise
              </a>
              <a
                href="#testimonials"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Kunden
              </a>
              <a
                href="#faq"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                FAQ
              </a>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate("/login")}>
                Anmelden
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate("/register")}
              >
                Kostenlos testen
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Premium Animated */}
      <AnimatedHero onGetStarted={handleGetStarted} />

      {/* Features Section */}
      <div id="features" className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 mb-4">
              <Zap className="h-4 w-4 mr-1" />
              Leistungsstarke Features
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
              Alles, was Sie brauchen
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Eine Lösung für alle Ihre Baumanagement-Prozesse
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                title: "Professionelle Angebote",
                description:
                  "Erstellen Sie in Minuten überzeugende Angebote mit unseren Templates. KI-gestützte Kalkulation inklusive.",
                color: "blue" as const,
              },
              {
                icon: Calendar,
                title: "Projekt-Management",
                description:
                  "Behalten Sie alle Bauprojekte im Blick – von Planung bis Abschluss. Gantt-Charts und Meilensteine inklusive.",
                color: "purple" as const,
              },
              {
                icon: DollarSign,
                title: "Rechnungen & Finanzen",
                description:
                  "Automatische Rechnungserstellung und Zahlungsüberwachung. Integriert mit DATEV und Lexoffice.",
                color: "green" as const,
              },
              {
                icon: Users,
                title: "Team-Zusammenarbeit",
                description:
                  "Arbeiten Sie nahtlos mit Ihrem Team zusammen, in Echtzeit. Chat, Kommentare und Aufgabenverwaltung.",
                color: "orange" as const,
              },
              {
                icon: Shield,
                title: "DSGVO-konform",
                description:
                  "Ihre Daten bleiben in Deutschland. 100% DSGVO-compliant. ISO 27001 zertifiziert.",
                color: "red" as const,
              },
              {
                icon: Zap,
                title: "Offline-fähig",
                description:
                  "Arbeiten Sie auch auf der Baustelle ohne Internet weiter. Automatische Synchronisation.",
                color: "yellow" as const,
              },
            ].map((feature, index) => (
              <Feature3DCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                color={feature.color}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <SocialProof />

      {/* Video Showcase Section */}
      <VideoShowcase />

      {/* Premium Pricing Section */}
      <PremiumPricing />

      {/* Testimonials Section */}
      <div id="pricing" className="py-24 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mb-4">
              <Award className="h-4 w-4 mr-1" />
              Transparente Preise
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
              Wählen Sie den passenden Plan
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Keine versteckten Kosten. Jederzeit kündbar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">0€</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    /Monat
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Für Einzelunternehmer
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {[
                    "1 Benutzer",
                    "10 Projekte/Monat",
                    "100 MB Speicher",
                    "Email Support",
                    "Basis-Features",
                  ].map((item) => (
                    <li key={item} className="flex items-center">
                      <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => navigate("/register")}
                >
                  Kostenlos starten
                </Button>
              </CardContent>
            </Card>

            {/* Professional */}
            <Card className="border-2 border-blue-600 relative shadow-xl scale-105 hover:shadow-2xl transition-all">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600">
                ⭐ Beliebteste Wahl
              </Badge>
              <CardHeader>
                <CardTitle>Professional</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">29,99€</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    /Monat
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Für kleine bis mittlere Teams
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {[
                    "10 Benutzer",
                    "Unbegrenzte Projekte",
                    "10 GB Speicher",
                    "Priority Support",
                    "Custom Branding",
                    "Erweiterte Analytics",
                    "API-Zugriff",
                  ].map((item) => (
                    <li key={item} className="flex items-center">
                      <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => navigate("/register")}
                >
                  14 Tage kostenlos testen
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">99,99€</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    /Monat
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Für große Organisationen
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {[
                    "Unlimited Benutzer",
                    "Unlimited Projekte",
                    "100 GB Speicher",
                    "24/7 Premium Support",
                    "Dedicated Server",
                    "SLA 99.9%",
                    "Persönliches Onboarding",
                    "White-Label Option",
                  ].map((item) => (
                    <li key={item} className="flex items-center">
                      <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() =>
                    (window.location.href = "mailto:sales@bauplan-buddy.de")
                  }
                >
                  Kontakt aufnehmen
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Feature Comparison */}
          <div className="mt-16 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Alle Pläne beinhalten: Offline-Modus, DSGVO-Konformität, Deutsche
              Server, Mobile App
            </p>
            <Button variant="link" className="text-blue-600">
              Detaillierter Feature-Vergleich
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div id="testimonials" className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
              Was unsere Kunden sagen
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Echte Erfahrungen von echten Bauunternehmen
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Michael Hoffmann",
                company: "Hoffmann Bau GmbH",
                role: "Geschäftsführer",
                text: "Bauplan Buddy hat unseren Workflow komplett verändert. Die Zeitersparnis bei der Angebotserstellung ist enorm – wir sind jetzt 70% schneller!",
                rating: 5,
                image: "🏗️",
                metric: "70% schneller",
              },
              {
                name: "Anna Schmidt",
                company: "Schmidt Renovierung",
                role: "Projektleiterin",
                text: "Endlich eine Software, die auch offline funktioniert. Perfekt für die Baustelle! Unsere Mitarbeiter lieben die mobile App.",
                rating: 5,
                image: "👷‍♀️",
                metric: "100% offline-fähig",
              },
              {
                name: "Thomas Weber",
                company: "Weber Bau AG",
                role: "IT-Leiter",
                text: "Der Support ist fantastisch und die Features sind genau das, was wir brauchen. DSGVO-konform und Made in Germany – perfekt für uns!",
                rating: 5,
                image: "🎯",
                metric: "24/7 Support",
              },
            ].map((testimonial, index) => (
              <Card
                key={index}
                className="hover:shadow-xl transition-shadow duration-300"
              >
                <CardHeader>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-3xl">
                      {testimonial.image}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {testimonial.role}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {testimonial.company}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <CardDescription className="text-base text-gray-700 dark:text-gray-300">
                    "{testimonial.text}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {testimonial.metric}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="mt-16 border-t border-gray-200 dark:border-gray-700 pt-8">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
              Vertraut von führenden Bauunternehmen
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8">
              {[
                "ISO 27001",
                "DSGVO",
                "Made in Germany",
                "SSL/TLS",
                "SOC 2",
              ].map((badge) => (
                <div
                  key={badge}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-400"
                >
                  <Shield className="h-5 w-5" />
                  <span className="font-medium">{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div id="faq" className="py-24 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
              Häufig gestellte Fragen
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Alles, was Sie über Bauplan Buddy wissen müssen
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "Wie sicher sind meine Daten?",
                answer:
                  "Ihre Daten sind bei uns in besten Händen. Wir nutzen modernste Verschlüsselungstechnologien (AES-256) und hosten ausschließlich in deutschen Rechenzentren. Alle Datenübertragungen erfolgen über SSL/TLS. Wir sind DSGVO-konform und ISO 27001 zertifiziert.",
              },
              {
                question: "Funktioniert die App auch offline?",
                answer:
                  "Ja! Bauplan Buddy ist eine Progressive Web App (PWA) und funktioniert vollständig offline. Alle Ihre Daten werden lokal gespeichert und automatisch synchronisiert, sobald Sie wieder online sind. Perfekt für die Arbeit auf der Baustelle!",
              },
              {
                question: "Kann ich die Software vor dem Kauf testen?",
                answer:
                  "Absolut! Wir bieten eine 14-tägige kostenlose Testphase an – keine Kreditkarte erforderlich. Sie erhalten vollen Zugriff auf alle Features und können die Software in Ruhe testen. Bei Fragen steht Ihnen unser Support-Team jederzeit zur Verfügung.",
              },
              {
                question: "Wie funktioniert die Preisgestaltung?",
                answer:
                  "Unsere Preise sind transparent und fair. Sie zahlen nur für aktive Benutzer und können jederzeit upgraden oder downgraden. Es gibt keine versteckten Kosten oder Einrichtungsgebühren. Alle Features sind in jedem Plan enthalten – nur die Anzahl der Projekte und Benutzer variiert.",
              },
              {
                question: "Welchen Support bieten Sie?",
                answer:
                  "Wir bieten umfassenden Support auf Deutsch: Email-Support für alle Kunden, Priority-Support für Professional-Kunden und 24/7 Support für Enterprise-Kunden. Zusätzlich haben wir eine ausführliche Wissensdatenbank, Video-Tutorials und regelmäßige Webinare.",
              },
              {
                question: "Kann ich meine bestehenden Daten importieren?",
                answer:
                  "Ja! Wir unterstützen den Import aus den gängigsten Formaten (Excel, CSV, PDF) und bieten kostenlose Unterstützung beim Datenimport für Enterprise-Kunden. Unser Team hilft Ihnen gerne beim reibungslosen Übergang von Ihrer alten Software.",
              },
            ].map((faq, index) => (
              <Card
                key={index}
                className="hover:border-blue-500 transition-colors"
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-start">
                    <MessageSquare className="h-5 w-5 mr-3 mt-1 text-blue-600 flex-shrink-0" />
                    {faq.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Weitere Fragen? Unser Team hilft Ihnen gerne weiter!
            </p>
            <Button
              variant="outline"
              size="lg"
              onClick={() =>
                (window.location.href = "mailto:support@bauplan-buddy.de")
              }
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              Kontakt aufnehmen
            </Button>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-24 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">
            Bereit für den nächsten Schritt?
          </h2>
          <p className="text-xl opacity-90">
            Starten Sie heute kostenlos – keine Kreditkarte erforderlich
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="ihre@email.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-white"
              onKeyPress={(e) => e.key === "Enter" && handleGetStarted()}
            />
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8"
            >
              Kostenlos starten
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Bauplan Buddy</h3>
              <p className="text-gray-400 text-sm">
                Die moderne Bau-Software für Ihr Business
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produkt</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#features">Features</a>
                </li>
                <li>
                  <a href="#pricing">Preise</a>
                </li>
                <li>
                  <a href="#demo">Demo</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Unternehmen</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#about">Über uns</a>
                </li>
                <li>
                  <a href="#contact">Kontakt</a>
                </li>
                <li>
                  <a href="#careers">Karriere</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#privacy">Datenschutz</a>
                </li>
                <li>
                  <a href="#terms">AGB</a>
                </li>
                <li>
                  <a href="#imprint">Impressum</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            © {new Date().getFullYear()} Bauplan Buddy. Alle Rechte vorbehalten.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
