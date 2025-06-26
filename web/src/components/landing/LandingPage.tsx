import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  BarChart3, 
  Zap, 
  Calendar, 
  Target, 
  ArrowRight, 
  CheckCircle,
  Users,
  Brain,
  Shuffle
} from "lucide-react";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="container mx-auto py-4 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-hero-gradient rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <span className="text-xl sm:text-2xl font-bold bg-hero-gradient bg-clip-text text-transparent">Grosonix</span>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Link href="/auth/login" className="text-text-primary hover:text-emerald-500 transition-colors text-sm sm:text-base">
            Login
          </Link>
          <Link href="/auth/signup">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm sm:text-base py-1 px-3 sm:py-2 sm:px-4">
              Sign Up
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-10 sm:py-20 flex flex-col lg:flex-row items-center">
        <div className="w-full lg:w-1/2 mb-10 lg:mb-0">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
            <span className="bg-hero-gradient bg-clip-text text-transparent">AI-Powered</span> Social Media Growth
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary mb-6 sm:mb-8 max-w-lg">
            Transform your social media presence with AI-driven content suggestions, cross-platform optimization, and data-backed growth strategies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10">
                Login
              </Button>
            </Link>
          </div>
          <div className="mt-6 flex items-center text-sm text-text-secondary">
            <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
            No credit card required
          </div>
        </div>
        <div className="w-full lg:w-1/2 relative mt-8 lg:mt-0">
          {/* First card - always visible */}
          <div className="relative z-10 glass-card border-emerald-500/20 p-6 rounded-xl shadow-xl transform rotate-2 hover:rotate-0 transition-all duration-300 mx-auto max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-semibold text-text-primary">AI Content Suggestions</h3>
            </div>
            <p className="text-text-secondary mb-4">
              "🚀 Just discovered how AI is revolutionizing social media marketing! The future is here and it's incredible. What's your take on AI-powered content creation? #AI #SocialMedia #Marketing"
            </p>
            <div className="flex justify-between items-center">
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-xs rounded-full">92% Engagement</span>
                <span className="px-2 py-1 bg-electric-orange-500/10 text-electric-orange-500 text-xs rounded-full">Trending</span>
              </div>
              <span className="text-sm text-text-secondary">Twitter</span>
            </div>
          </div>
          
          {/* Second card - hidden on mobile, absolute positioned on desktop */}
          <div className="relative z-0 glass-card border-neon-cyan-500/20 p-6 rounded-xl shadow-xl transform -rotate-3 hover:rotate-0 transition-all duration-300 mt-6 lg:mt-0 mx-auto max-w-md lg:absolute lg:top-20 lg:-right-4">
            <div className="flex items-center gap-3 mb-4">
              <Shuffle className="w-5 h-5 text-neon-cyan-500" />
              <h3 className="text-lg font-semibold text-text-primary">Cross-Platform Adaptation</h3>
            </div>
            <p className="text-text-secondary mb-4">
              "✨ AI is transforming how we create and share content! What innovative ways are you using AI in your workflow? #Innovation #AITools #ContentCreation"
            </p>
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-neon-cyan-500/10 text-neon-cyan-500 text-xs rounded-full">LinkedIn Optimized</span>
              </div>
              <span className="text-sm text-text-secondary">LinkedIn</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-surface/50 py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 bg-hero-gradient bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto">
              Everything you need to grow your social media presence with AI-powered tools and data-driven insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="glass-card border-emerald-500/20 p-6 rounded-xl hover:shadow-glow-emerald transition-all duration-300">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-text-primary">AI Content Intelligence</h3>
              <p className="text-text-secondary mb-4">
                Get personalized content suggestions based on your unique voice and style. Our AI learns from your best-performing posts.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-text-secondary">Personalized suggestions</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-text-secondary">Trending topic analysis</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-text-secondary">Engagement optimization</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="glass-card border-electric-orange-500/20 p-6 rounded-xl hover:shadow-glow-orange transition-all duration-300">
              <div className="w-12 h-12 bg-electric-orange-500/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-electric-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-text-primary">Growth Tracking</h3>
              <p className="text-text-secondary mb-4">
                Monitor your social media growth with real-time analytics and actionable insights across all platforms.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-electric-orange-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-text-secondary">Real-time metrics</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-electric-orange-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-text-secondary">Performance analytics</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-electric-orange-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-text-secondary">Growth predictions</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="glass-card border-neon-cyan-500/20 p-6 rounded-xl hover:shadow-glow-cyan transition-all duration-300">
              <div className="w-12 h-12 bg-neon-cyan-500/10 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-neon-cyan-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-text-primary">Smart Scheduling</h3>
              <p className="text-text-secondary mb-4">
                Schedule your content at optimal times for maximum engagement based on AI-powered analysis.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-neon-cyan-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-text-secondary">Optimal posting times</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-neon-cyan-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-text-secondary">Content calendar</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-neon-cyan-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-text-secondary">Auto-scheduling</span>
                </li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="glass-card border-purple-500/20 p-6 rounded-xl hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-text-primary">Goal Setting</h3>
              <p className="text-text-secondary mb-4">
                Set and track your social media growth goals with gamified progress tracking and milestones.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-purple-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-text-secondary">Custom goal tracking</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-purple-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-text-secondary">Progress visualization</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-purple-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-text-secondary">Achievement celebrations</span>
                </li>
              </ul>
            </div>

            {/* Feature 5 */}
            <div className="glass-card border-blue-500/20 p-6 rounded-xl hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-text-primary">Style Analysis</h3>
              <p className="text-text-secondary mb-4">
                Our AI analyzes your writing style to generate content that sounds authentically like you.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-text-secondary">Voice matching</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-text-secondary">Tone consistency</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-text-secondary">Brand alignment</span>
                </li>
              </ul>
            </div>

            {/* Feature 6 */}
            <div className="glass-card border-pink-500/20 p-6 rounded-xl hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-pink-500/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-text-primary">Multi-Platform</h3>
              <p className="text-text-secondary mb-4">
                Manage Twitter, LinkedIn, and Instagram from one dashboard with platform-specific optimization.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-pink-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-text-secondary">Cross-platform analytics</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-pink-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-text-secondary">Content adaptation</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-pink-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-text-secondary">Unified dashboard</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 bg-hero-gradient bg-clip-text text-transparent">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto">
              Choose the plan that fits your needs. No hidden fees, no surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="glass-card border-emerald-500/20 p-6 rounded-xl hover:shadow-lg transition-all duration-300">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-text-primary">Free</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold text-text-primary">$0</span>
                  <span className="text-text-secondary">/month</span>
                </div>
                <Link href="/auth/signup" className="block">
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                    Get Started
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                  <span className="text-text-secondary">5 AI content suggestions/day</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                  <span className="text-text-secondary">Basic analytics dashboard</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                  <span className="text-text-secondary">Connect 3 social accounts</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                  <span className="text-text-secondary">7-day data history</span>
                </div>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="glass-card border-electric-orange-500/20 p-6 rounded-xl shadow-lg relative md:transform md:scale-105 hover:shadow-glow-orange transition-all duration-300">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-electric-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-text-primary">Pro</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold text-text-primary">$9.99</span>
                  <span className="text-text-secondary">/month</span>
                </div>
                <Link href="/auth/signup" className="block">
                  <Button className="w-full bg-electric-orange-500 hover:bg-electric-orange-600 text-white">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-electric-orange-500 mr-3 flex-shrink-0" />
                  <span className="text-text-secondary">Unlimited content generation</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-electric-orange-500 mr-3 flex-shrink-0" />
                  <span className="text-text-secondary">Cross-platform adaptation</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-electric-orange-500 mr-3 flex-shrink-0" />
                  <span className="text-text-secondary">Advanced analytics & insights</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-electric-orange-500 mr-3 flex-shrink-0" />
                  <span className="text-text-secondary">Smart scheduling</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-electric-orange-500 mr-3 flex-shrink-0" />
                  <span className="text-text-secondary">30-day data history</span>
                </div>
              </div>
            </div>

            {/* Agency Plan */}
            <div className="glass-card border-neon-cyan-500/20 p-6 rounded-xl hover:shadow-lg transition-all duration-300">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-text-primary">Agency</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold text-text-primary">$29.99</span>
                  <span className="text-text-secondary">/month</span>
                </div>
                <Link href="/auth/signup" className="block">
                  <Button className="w-full bg-neon-cyan-500 hover:bg-neon-cyan-600 text-white">
                    Contact Sales
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-neon-cyan-500 mr-3 flex-shrink-0" />
                  <span className="text-text-secondary">Everything in Pro plan</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-neon-cyan-500 mr-3 flex-shrink-0" />
                  <span className="text-text-secondary">Team collaboration</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-neon-cyan-500 mr-3 flex-shrink-0" />
                  <span className="text-text-secondary">Priority AI processing</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-neon-cyan-500 mr-3 flex-shrink-0" />
                  <span className="text-text-secondary">Custom branding</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-neon-cyan-500 mr-3 flex-shrink-0" />
                  <span className="text-text-secondary">90-day data history</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-surface/50 py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 bg-hero-gradient bg-clip-text text-transparent">
              What Our Users Say
            </h2>
            <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto">
              Join thousands of creators and businesses growing their social media presence with Grosonix.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Testimonial 1 */}
            <div className="glass-card border-emerald-500/20 p-6 rounded-xl hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-xl font-bold text-emerald-500">S</span>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">Sarah Johnson</h4>
                  <p className="text-sm text-text-secondary">Content Creator</p>
                </div>
              </div>
              <p className="text-text-secondary mb-4">
                "Grosonix has completely transformed how I create content. The AI suggestions are spot-on and save me hours every week. My engagement has increased by 45% in just one month!"
              </p>
              <div className="flex text-emerald-500">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="glass-card border-electric-orange-500/20 p-6 rounded-xl hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-electric-orange-500/20 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-xl font-bold text-electric-orange-500">M</span>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">Michael Chen</h4>
                  <p className="text-sm text-text-secondary">Marketing Director</p>
                </div>
              </div>
              <p className="text-text-secondary mb-4">
                "The cross-platform adaptation feature is a game-changer. We can create content once and optimize it for all our channels with a single click. Our team's productivity has doubled."
              </p>
              <div className="flex text-electric-orange-500">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="glass-card border-neon-cyan-500/20 p-6 rounded-xl hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-neon-cyan-500/20 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-xl font-bold text-neon-cyan-500">A</span>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">Alex Rivera</h4>
                  <p className="text-sm text-text-secondary">Small Business Owner</p>
                </div>
              </div>
              <p className="text-text-secondary mb-4">
                "As a small business owner, I don't have time to manage multiple social platforms. Grosonix makes it easy with smart scheduling and AI content that matches my brand voice perfectly."
              </p>
              <div className="flex text-neon-cyan-500">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="glass-card border-emerald-500/20 p-6 sm:p-10 rounded-2xl bg-mesh-gradient bg-cover bg-center relative overflow-hidden">
            <div className="relative z-10 max-w-3xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-white">
                Ready to Transform Your Social Media Presence?
              </h2>
              <p className="text-lg sm:text-xl text-white/90 mb-6 sm:mb-8">
                Join thousands of creators and businesses using Grosonix to grow their audience and engagement.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-emerald-600 hover:bg-white/90">
                    Start Your Free Trial
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/auth/login" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
                    Login
                  </Button>
                </Link>
              </div>
              <p className="mt-6 text-sm text-white/80">
                No credit card required. Free plan available with no time limit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-6 md:mb-0">
              <div className="w-8 h-8 bg-hero-gradient rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-hero-gradient bg-clip-text text-transparent">Grosonix</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              <Link href="/auth/login" className="text-text-secondary hover:text-emerald-500 transition-colors">
                Login
              </Link>
              <Link href="/auth/signup" className="text-text-secondary hover:text-emerald-500 transition-colors">
                Sign Up
              </Link>
              <a href="#" className="text-text-secondary hover:text-emerald-500 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-text-secondary hover:text-emerald-500 transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-text-muted">
            &copy; {new Date().getFullYear()} Grosonix. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}