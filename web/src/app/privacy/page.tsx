import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Eye,
  Lock,
  Users,
  Database,
  Globe,
} from "lucide-react";

export default function PrivacyPolicy() {
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
                <Shield className="w-4 h-4 text-white" />
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
              <Shield className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-hero-gradient bg-clip-text text-transparent">
              Privacy Policy
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
                <Eye className="w-6 h-6 text-emerald-500" />
                Introduction
              </h2>
              <p className="text-text-secondary leading-relaxed">
                At Grosonix, we take your privacy seriously. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your
                information when you use our AI-powered social media growth
                platform. By using our service, you agree to the collection and
                use of information in accordance with this policy.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-text-primary flex items-center gap-2">
                <Database className="w-6 h-6 text-emerald-500" />
                Information We Collect
              </h2>

              <div className="space-y-6">
                <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                  <h3 className="text-xl font-semibold mb-3 text-text-primary">
                    Personal Information
                  </h3>
                  <ul className="space-y-2 text-text-secondary">
                    <li>
                      • Email address and full name (for account creation)
                    </li>
                    <li>• Profile information and preferences</li>
                    <li>
                      • Social media account connections (Twitter, LinkedIn,
                      Instagram)
                    </li>
                    <li>
                      • Payment information (processed securely through
                      RevenueCat)
                    </li>
                  </ul>
                </div>

                <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                  <h3 className="text-xl font-semibold mb-3 text-text-primary">
                    Content and Usage Data
                  </h3>
                  <ul className="space-y-2 text-text-secondary">
                    <li>• Social media posts and content for style analysis</li>
                    <li>• AI-generated content suggestions and adaptations</li>
                    <li>• Usage patterns and feature interactions</li>
                    <li>• Analytics and performance metrics</li>
                  </ul>
                </div>

                <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                  <h3 className="text-xl font-semibold mb-3 text-text-primary">
                    Technical Information
                  </h3>
                  <ul className="space-y-2 text-text-secondary">
                    <li>• Device information and browser type</li>
                    <li>• IP address and location data</li>
                    <li>• Cookies and similar tracking technologies</li>
                    <li>• API usage and rate limiting data</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-text-primary flex items-center gap-2">
                <Lock className="w-6 h-6 text-emerald-500" />
                How We Use Your Information
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                  <h3 className="text-lg font-semibold mb-3 text-text-primary">
                    Service Delivery
                  </h3>
                  <ul className="space-y-2 text-text-secondary text-sm">
                    <li>• Generate AI-powered content suggestions</li>
                    <li>• Analyze your writing style and voice</li>
                    <li>• Provide cross-platform content adaptation</li>
                    <li>• Track usage quotas and subscription limits</li>
                  </ul>
                </div>

                <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                  <h3 className="text-lg font-semibold mb-3 text-text-primary">
                    Account Management
                  </h3>
                  <ul className="space-y-2 text-text-secondary text-sm">
                    <li>• Authenticate and secure your account</li>
                    <li>• Process payments and manage subscriptions</li>
                    <li>• Provide customer support</li>
                    <li>• Send important service notifications</li>
                  </ul>
                </div>

                <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                  <h3 className="text-lg font-semibold mb-3 text-text-primary">
                    Improvement & Analytics
                  </h3>
                  <ul className="space-y-2 text-text-secondary text-sm">
                    <li>• Improve our AI algorithms and features</li>
                    <li>• Analyze usage patterns and performance</li>
                    <li>• Develop new features and capabilities</li>
                    <li>• Ensure platform security and stability</li>
                  </ul>
                </div>

                <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                  <h3 className="text-lg font-semibold mb-3 text-text-primary">
                    Legal Compliance
                  </h3>
                  <ul className="space-y-2 text-text-secondary text-sm">
                    <li>• Comply with applicable laws and regulations</li>
                    <li>• Respond to legal requests and court orders</li>
                    <li>• Protect against fraud and abuse</li>
                    <li>• Enforce our Terms of Service</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Third-Party Services */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-text-primary flex items-center gap-2">
                <Globe className="w-6 h-6 text-emerald-500" />
                Third-Party Services
              </h2>

              <div className="space-y-4">
                <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                  <h3 className="text-lg font-semibold mb-3 text-text-primary">
                    Service Providers
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-text-secondary text-sm">
                    <div>
                      <strong className="text-text-primary">Supabase:</strong>{" "}
                      Database and authentication services
                    </div>
                    <div>
                      <strong className="text-text-primary">OpenAI:</strong> AI
                      content generation and analysis
                    </div>
                    <div>
                      <strong className="text-text-primary">RevenueCat:</strong>{" "}
                      Subscription and payment processing
                    </div>
                    <div>
                      <strong className="text-text-primary">
                        Social Media APIs:
                      </strong>{" "}
                      Twitter, LinkedIn, Instagram integration
                    </div>
                  </div>
                </div>

                <p className="text-text-secondary text-sm">
                  These third-party services have their own privacy policies. We
                  encourage you to review their policies to understand how they
                  handle your data.
                </p>
              </div>
            </section>

            {/* Data Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-text-primary flex items-center gap-2">
                <Lock className="w-6 h-6 text-emerald-500" />
                Data Security
              </h2>

              <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                <p className="text-text-secondary leading-relaxed mb-4">
                  We implement industry-standard security measures to protect
                  your personal information:
                </p>
                <ul className="space-y-2 text-text-secondary">
                  <li>• End-to-end encryption for data transmission</li>
                  <li>• Secure token storage for social media connections</li>
                  <li>• Regular security audits and monitoring</li>
                  <li>• Access controls and authentication protocols</li>
                  <li>
                    • Secure payment processing through certified providers
                  </li>
                </ul>
              </div>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-text-primary flex items-center gap-2">
                <Users className="w-6 h-6 text-emerald-500" />
                Your Rights
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                  <h3 className="text-lg font-semibold mb-3 text-text-primary">
                    Access & Control
                  </h3>
                  <ul className="space-y-2 text-text-secondary text-sm">
                    <li>• Access your personal data</li>
                    <li>• Update or correct information</li>
                    <li>• Delete your account and data</li>
                    <li>• Export your data</li>
                  </ul>
                </div>

                <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                  <h3 className="text-lg font-semibold mb-3 text-text-primary">
                    Privacy Controls
                  </h3>
                  <ul className="space-y-2 text-text-secondary text-sm">
                    <li>• Opt-out of marketing communications</li>
                    <li>• Manage cookie preferences</li>
                    <li>• Control data sharing settings</li>
                    <li>• Request data portability</li>
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
                  If you have any questions about this Privacy Policy or our
                  data practices, please open an issue on the{" "}
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

            {/* Updates */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-text-primary">
                Policy Updates
              </h2>
              <div className="bg-surface/30 rounded-xl p-6 border border-border/50">
                <p className="text-text-secondary leading-relaxed">
                  We may update this Privacy Policy from time to time. We will
                  notify you of any changes by posting the new Privacy Policy on
                  this page and updating the "Last updated" date. You are
                  advised to review this Privacy Policy periodically for any
                  changes.
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
              <Shield className="w-3 h-3 text-white" />
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
            <Link
              href="/terms"
              className="text-text-secondary hover:text-emerald-500 transition-colors">
              Terms of Service
            </Link>
            <span className="text-text-muted">Privacy Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
