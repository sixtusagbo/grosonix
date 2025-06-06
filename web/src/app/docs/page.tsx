'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/docs')
      .then(res => res.json())
      .then(data => {
        setSpec(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load API spec:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-deep-space flex items-center justify-center">
        <div className="glass-card p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-purple mx-auto"></div>
          <p className="text-silver mt-4 text-center">Loading API Documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-space">
      <div className="container mx-auto px-4 py-8">
        <div className="glass-card p-6 mb-6">
          <h1 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-electric-purple to-cyber-blue bg-clip-text text-transparent">
            Grosonix API Documentation
          </h1>
          <p className="text-silver">
            Complete API reference for the Grosonix AI-powered social media growth platform.
          </p>
        </div>

        <div className="glass-card p-6">
          {spec ? (
            <div className="swagger-ui-container">
              <SwaggerUI 
                spec={spec} 
                docExpansion="list"
                defaultModelsExpandDepth={2}
                tryItOutEnabled={true}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-danger-red">Failed to load API documentation</p>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .swagger-ui-container .swagger-ui {
          font-family: inherit;
        }
        
        .swagger-ui-container .swagger-ui .topbar {
          display: none;
        }
        
        .swagger-ui-container .swagger-ui .info {
          margin: 0;
        }
        
        .swagger-ui-container .swagger-ui .scheme-container {
          background: transparent;
          box-shadow: none;
          padding: 0;
        }
        
        .swagger-ui-container .swagger-ui .opblock {
          background: rgba(26, 26, 46, 0.5);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 8px;
          margin-bottom: 1rem;
        }
        
        .swagger-ui-container .swagger-ui .opblock .opblock-summary {
          border: none;
          padding: 1rem;
        }
        
        .swagger-ui-container .swagger-ui .opblock.opblock-get .opblock-summary {
          border-color: #06B6D4;
        }
        
        .swagger-ui-container .swagger-ui .opblock.opblock-post .opblock-summary {
          border-color: #10B981;
        }
        
        .swagger-ui-container .swagger-ui .opblock.opblock-put .opblock-summary {
          border-color: #F59E0B;
        }
        
        .swagger-ui-container .swagger-ui .opblock.opblock-delete .opblock-summary {
          border-color: #EF4444;
        }
        
        .swagger-ui-container .swagger-ui .btn {
          background: #8B5CF6;
          border: none;
          border-radius: 6px;
          color: white;
          padding: 0.5rem 1rem;
        }
        
        .swagger-ui-container .swagger-ui .btn:hover {
          background: #7C3AED;
        }
        
        .swagger-ui-container .swagger-ui .parameter__name {
          color: #E2E8F0;
        }
        
        .swagger-ui-container .swagger-ui .parameter__type {
          color: #06B6D4;
        }
        
        .swagger-ui-container .swagger-ui .response-col_status {
          color: #10B981;
        }
        
        .swagger-ui-container .swagger-ui .response-col_description {
          color: #E2E8F0;
        }
        
        .swagger-ui-container .swagger-ui .model {
          background: rgba(15, 15, 35, 0.8);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 6px;
        }
        
        .swagger-ui-container .swagger-ui .model-title {
          color: #8B5CF6;
        }
        
        .swagger-ui-container .swagger-ui .prop-type {
          color: #06B6D4;
        }
        
        .swagger-ui-container .swagger-ui .prop-name {
          color: #E2E8F0;
        }
        
        .swagger-ui-container .swagger-ui .renderedMarkdown p {
          color: #E2E8F0;
        }
        
        .swagger-ui-container .swagger-ui .tab {
          background: transparent;
          border: 1px solid rgba(139, 92, 246, 0.2);
          color: #E2E8F0;
        }
        
        .swagger-ui-container .swagger-ui .tab.active {
          background: #8B5CF6;
          color: white;
        }
      `}</style>
    </div>
  );
}