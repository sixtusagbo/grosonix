import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Scale,
  AlertTriangle,
  Crown,
  Zap,
  Users,
} from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface/50 border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-text-secondary hover:text-emerald-500 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-hero-gradient rounded-lg flex items-center justify-center">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-hero-gradient bg-clip-text text-transparent">
                Grosonix
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="glass-card p-8 rounded-2xl">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-hero-gradient bg-clip-text text-transparent">
              Terms of Service
            </h1>
            <p className="text-text-secondary text-lg">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="prose prose-invert max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-text-primary flex items-center gap-2">
                <Scale className="w-6 h-6 text-emerald-500" />
                Agreement to Terms
              </h2>
              <p className="text-text-secondary leading-relaxed">
                Welcome to Grosonix! These Terms of Service ("Terms") govern
                your use of our AI-powered social media growth platform. By
                accessing or using our service, you agree to be bound by these
                Terms. If you disagree with any part of these terms, you may not
                access the service.
              </p>
            </section>

            {/* Service Description */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-text-primary flex items-center gap-2">
                <Zap className="w-6 h-6 text-emerald-500" />
                Service Description
              </h2>

              <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                <p className="text-text-secondary leading-relaxed mb-4">
                  Grosonix provides AI-powered tools and services for social
                  media growth, including:
                </p>
                <ul className="space-y-2 text-text-secondary">
                  <li>• AI content generation and suggestions</li>
                  <li>• Writing style analysis and voice profiling</li>
                  <li>• Cross-platform content adaptation</li>
                  <li>• Social media analytics and insights</li>
                  <li>• Growth tracking and goal management</li>
                  <li>
                    • Multi-platform integration (Twitter, LinkedIn, Instagram)
                  </li>
                </ul>
              </div>
            </section>

            {/* User Accounts */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-text-primary flex items-center gap-2">
                <Users className="w-6 h-6 text-emerald-500" />
                User Accounts
              </h2>

              <div className="space-y-4">
                <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                  <h3 className="text-lg font-semibold mb-3 text-text-primary">
                    Account Creation
                  </h3>
                  <ul className="space-y-2 text-text-secondary text-sm">
                    <li>
                      • You must provide accurate and complete information
                    </li>
                    <li>
                      • You are responsible for maintaining account security
                    </li>
                    <li>• One account per person or organization</li>
                    <li>
                      • You must be at least 13 years old to use our service
                    </li>
                  </ul>
                </div>

                <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                  <h3 className="text-lg font-semibold mb-3 text-text-primary">
                    Account Responsibilities
                  </h3>
                  <ul className="space-y-2 text-text-secondary text-sm">
                    <li>
                      • Keep your login credentials secure and confidential
                    </li>
                    <li>• Notify us immediately of any unauthorized access</li>
                    <li>
                      • You are liable for all activities under your account
                    </li>
                    <li>• Do not share your account with others</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Subscription Plans */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-text-primary flex items-center gap-2">
                <Crown className="w-6 h-6 text-emerald-500" />
                Subscription Plans & Billing
              </h2>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                  <h3 className="text-lg font-semibold mb-3 text-emerald-500">
                    Free Plan
                  </h3>
                  <ul className="space-y-2 text-text-secondary text-sm">
                    <li>• 5 AI generations per day</li>
                    <li>• 1 style analysis per day</li>
                    <li>• Basic features only</li>
                    <li>• No payment required</li>
                  </ul>
                </div>

                <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                  <h3 className="text-lg font-semibold mb-3 text-electric-orange-500">
                    Pro Plan
                  </h3>
                  <ul className="space-y-2 text-text-secondary text-sm">
                    <li>• 50 AI generations per day</li>
                    <li>• 25 cross-platform adaptations</li>
                    <li>• 10 style analyses per day</li>
                    <li>• Advanced features</li>
                  </ul>
                </div>

                <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                  <h3 className="text-lg font-semibold mb-3 text-neon-cyan-500">
                    Agency Plan
                  </h3>
                  <ul className="space-y-2 text-text-secondary text-sm">
                    <li>• 200 AI generations per day</li>
                    <li>• 100 cross-platform adaptations</li>
                    <li>• 50 style analyses per day</li>
                    <li>• Team collaboration features</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 bg-surface/30 rounded-xl p-6 border border-border/50">
                <h3 className="text-lg font-semibold mb-3 text-text-primary">
                  Billing Terms
                </h3>
                <ul className="space-y-2 text-text-secondary text-sm">
                  <li>
                    • Subscriptions are billed monthly or annually in advance
                  </li>
                  <li>
                    • Free trial available for new Pro subscribers (7 days)
                  </li>
                  <li>
                    • Automatic renewal unless cancelled before billing cycle
                  </li>
                  <li>• Refunds available within 30 days of purchase</li>
                  <li>• Usage limits reset daily at midnight UTC</li>
                </ul>
              </div>
            </section>

            {/* Acceptable Use */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-text-primary flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-emerald-500" />
                Acceptable Use Policy
              </h2>

              <div className="space-y-6">
                <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                  <h3 className="text-lg font-semibold mb-3 text-text-primary">
                    Permitted Uses
                  </h3>
                  <ul className="space-y-2 text-text-secondary text-sm">
                    <li>
                      • Generate content for legitimate business and personal
                      use
                    </li>
                    <li>• Analyze your own social media content and style</li>
                    <li>
                      • Use AI suggestions to improve your content strategy
                    </li>
                    <li>• Connect your own social media accounts</li>
                  </ul>
                </div>

                <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/20">
                  <h3 className="text-lg font-semibold mb-3 text-red-400">
                    Prohibited Uses
                  </h3>
                  <ul className="space-y-2 text-text-secondary text-sm">
                    <li>• Generate spam, misleading, or harmful content</li>
                    <li>
                      • Violate any social media platform's terms of service
                    </li>
                    <li>• Attempt to reverse engineer or copy our AI models</li>
                    <li>• Use the service for illegal activities</li>
                    <li>• Share or resell access to your account</li>
                    <li>
                      • Attempt to circumvent usage limits or security measures
                    </li>
                    <li>
                      • Generate content that infringes on intellectual property
                      rights
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* AI Content & Intellectual Property */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">
                AI Content & Intellectual Property
              </h2>

              <div className="space-y-4">
                <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                  <h3 className="text-lg font-semibold mb-3 text-text-primary">
                    Content Ownership
                  </h3>
                  <ul className="space-y-2 text-text-secondary text-sm">
                    <li>
                      • You retain ownership of content you create using our AI
                      tools
                    </li>
                    <li>
                      • AI-generated suggestions are provided as-is without
                      warranty
                    </li>
                    <li>
                      • You are responsible for reviewing and editing
                      AI-generated content
                    </li>
                    <li>
                      • We may use anonymized data to improve our AI models
                    </li>
                  </ul>
                </div>

                <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                  <h3 className="text-lg font-semibold mb-3 text-text-primary">
                    Platform Rights
                  </h3>
                  <ul className="space-y-2 text-text-secondary text-sm">
                    <li>
                      • Grosonix retains all rights to our platform and
                      technology
                    </li>
                    <li>• Our AI models and algorithms are proprietary</li>
                    <li>
                      • You may not copy, modify, or distribute our software
                    </li>
                    <li>
                      • All trademarks and logos are owned by their respective
                      owners
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data & Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">
                Data & Privacy
              </h2>

              <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                <p className="text-text-secondary leading-relaxed mb-4">
                  Your privacy is important to us. Our data practices are
                  governed by our Privacy Policy, which includes:
                </p>
                <ul className="space-y-2 text-text-secondary text-sm">
                  <li>• How we collect and use your personal information</li>
                  <li>• Social media account integration and token storage</li>
                  <li>• AI analysis of your content and writing style</li>
                  <li>
                    • Third-party service integrations (OpenAI, RevenueCat,
                    etc.)
                  </li>
                  <li>• Your rights regarding your personal data</li>
                </ul>
                <p className="text-text-secondary mt-4">
                  Please review our{" "}
                  <Link
                    href="/privacy"
                    className="text-emerald-500 hover:text-emerald-400 transition-colors">
                    Privacy Policy
                  </Link>{" "}
                  for complete details.
                </p>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">
                Limitation of Liability
              </h2>

              <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                <p className="text-text-secondary leading-relaxed mb-4">
                  To the maximum extent permitted by law:
                </p>
                <ul className="space-y-2 text-text-secondary text-sm">
                  <li>• Our service is provided "as is" without warranties</li>
                  <li>• We are not liable for AI-generated content accuracy</li>
                  <li>
                    • We are not responsible for third-party platform changes
                  </li>
                  <li>
                    • Our liability is limited to the amount you paid for the
                    service
                  </li>
                  <li>
                    • We are not liable for indirect or consequential damages
                  </li>
                </ul>
              </div>
            </section>

            {/* Termination */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">
                Termination
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                  <h3 className="text-lg font-semibold mb-3 text-text-primary">
                    By You
                  </h3>
                  <ul className="space-y-2 text-text-secondary text-sm">
                    <li>• Cancel your subscription anytime</li>
                    <li>• Delete your account from settings</li>
                    <li>• Export your data before deletion</li>
                    <li>• No refund for partial billing periods</li>
                  </ul>
                </div>

                <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                  <h3 className="text-lg font-semibold mb-3 text-text-primary">
                    By Us
                  </h3>
                  <ul className="space-y-2 text-text-secondary text-sm">
                    <li>• Violation of these Terms</li>
                    <li>• Fraudulent or abusive behavior</li>
                    <li>• Non-payment of subscription fees</li>
                    <li>• At our discretion with notice</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">
                Contact Us
              </h2>
              <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                <p className="text-text-secondary leading-relaxed">
                  If you have any questions about these Terms of Service, please
                  open an issue on the{" "}
                  <a
                    href="https://github.com/sixtusagbo/grosonix/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-500 hover:text-emerald-400 transition-colors underline">
                    GitHub repo
                  </a>
                  .
                </p>
              </div>
            </section>

            {/* Changes to Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">
                Changes to Terms
              </h2>
              <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                <p className="text-text-secondary leading-relaxed">
                  We reserve the right to modify these Terms at any time. We
                  will notify users of any material changes via email or through
                  our platform. Continued use of the service after changes
                  constitutes acceptance of the new Terms.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-hero-gradient rounded-lg flex items-center justify-center">
              <Scale className="w-3 h-3 text-white" />
            </div>
            <span className="text-lg font-bold bg-hero-gradient bg-clip-text text-transparent">
              Grosonix
            </span>
          </div>
          <div className="flex justify-center gap-6 text-sm">
            <Link
              href="/"
              className="text-text-secondary hover:text-emerald-500 transition-colors">
              Home
            </Link>
            <span className="text-text-muted">Terms of Service</span>
            <Link
              href="/privacy"
              className="text-text-secondary hover:text-emerald-500 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
