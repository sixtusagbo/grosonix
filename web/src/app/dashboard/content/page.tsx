export default function ContentPage() {
  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Content Intelligence</h1>
        <p className="text-silver">
          AI-powered content suggestions and optimization tools.
        </p>
      </div>

      <div className="glass-card p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-electric-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-electric-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">AI Content Engine Coming Soon</h3>
          <p className="text-silver max-w-md mx-auto">
            Get personalized content suggestions, cross-platform optimization, and viral trend predictions.
          </p>
        </div>
      </div>
    </div>
  );
}