"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/docs")
      .then((res) => res.json())
      .then((data) => {
        setSpec(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load API spec:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-deep-space flex items-center justify-center">
        <div className="glass-card p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-purple mx-auto"></div>
          <p className="text-silver mt-4 text-center">
            Loading API Documentation...
          </p>
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
            Complete API reference for the Grosonix AI-powered social media
            growth platform.
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
              <p className="text-danger-red">
                Failed to load API documentation
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        /* Base Swagger UI styling */
        .swagger-ui-container .swagger-ui {
          font-family: inherit;
          background: transparent !important;
          color: #e2e8f0 !important;
        }

        /* Hide default topbar */
        .swagger-ui-container .swagger-ui .topbar {
          display: none;
        }

        /* Info section */
        .swagger-ui-container .swagger-ui .info {
          margin: 0;
          background: transparent;
        }

        .swagger-ui-container .swagger-ui .info .title {
          color: #e2e8f0;
        }

        .swagger-ui-container .swagger-ui .info .description {
          color: #94a3b8;
        }

        /* Scheme container */
        .swagger-ui-container .swagger-ui .scheme-container {
          background: rgba(26, 26, 46, 0.3);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 8px;
          box-shadow: none;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .swagger-ui-container .swagger-ui .auth-wrapper {
          background: transparent;
          border: none;
          padding: 0;
        }

        /* Operation blocks */
        .swagger-ui-container .swagger-ui .opblock {
          background: rgba(26, 26, 46, 0.5) !important;
          border: 1px solid rgba(139, 92, 246, 0.2) !important;
          border-radius: 8px !important;
          margin-bottom: 1rem !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2) !important;
        }

        .swagger-ui-container .swagger-ui .opblock .opblock-summary {
          border: none !important;
          padding: 1rem !important;
          background: transparent !important;
        }

        .swagger-ui-container .swagger-ui .opblock .opblock-summary-method {
          background: #06b6d4 !important;
          color: white !important;
          border-radius: 4px !important;
          min-width: 60px !important;
          text-align: center !important;
        }

        .swagger-ui-container
          .swagger-ui
          .opblock.opblock-get
          .opblock-summary-method {
          background: #06b6d4 !important;
        }

        .swagger-ui-container
          .swagger-ui
          .opblock.opblock-post
          .opblock-summary-method {
          background: #10b981 !important;
        }

        .swagger-ui-container
          .swagger-ui
          .opblock.opblock-put
          .opblock-summary-method {
          background: #f59e0b !important;
        }

        .swagger-ui-container
          .swagger-ui
          .opblock.opblock-delete
          .opblock-summary-method {
          background: #ef4444 !important;
        }

        .swagger-ui-container .swagger-ui .opblock .opblock-summary-path {
          color: #e2e8f0 !important;
          font-weight: 500 !important;
        }

        .swagger-ui-container
          .swagger-ui
          .opblock
          .opblock-summary-description {
          color: #94a3b8 !important;
        }

        /* Operation details */
        .swagger-ui-container .swagger-ui .opblock-body {
          background: rgba(15, 15, 35, 0.8) !important;
          border-top: 1px solid rgba(139, 92, 246, 0.2) !important;
        }

        .swagger-ui-container .swagger-ui .opblock-section {
          background: transparent !important;
        }

        .swagger-ui-container .swagger-ui .opblock-section-header {
          background: transparent !important;
          color: #8b5cf6 !important;
          border-bottom: 1px solid rgba(139, 92, 246, 0.2) !important;
        }

        /* Parameters */
        .swagger-ui-container .swagger-ui .parameters-col_description {
          color: #e2e8f0 !important;
        }

        .swagger-ui-container .swagger-ui .parameter__name {
          color: #e2e8f0 !important;
          font-weight: 600 !important;
        }

        .swagger-ui-container .swagger-ui .parameter__type {
          color: #06b6d4 !important;
        }

        .swagger-ui-container .swagger-ui .parameter__in {
          color: #94a3b8 !important;
        }

        /* Tables */
        .swagger-ui-container .swagger-ui table {
          background: transparent !important;
        }

        .swagger-ui-container .swagger-ui table thead tr th {
          background: rgba(139, 92, 246, 0.1) !important;
          color: #8b5cf6 !important;
          border-bottom: 1px solid rgba(139, 92, 246, 0.2) !important;
        }

        .swagger-ui-container .swagger-ui table tbody tr td {
          color: #e2e8f0 !important;
          border-bottom: 1px solid rgba(139, 92, 246, 0.1) !important;
        }

        /* Buttons */
        .swagger-ui-container .swagger-ui .btn {
          background: #8b5cf6 !important;
          border: none !important;
          border-radius: 6px !important;
          color: white !important;
          padding: 0.5rem 1rem !important;
          font-weight: 500 !important;
          transition: all 0.2s ease !important;
        }

        .swagger-ui-container .swagger-ui .btn:hover {
          background: #7c3aed !important;
          transform: translateY(-1px) !important;
        }

        .swagger-ui-container .swagger-ui .btn.cancel {
          background: #64748b !important;
        }

        .swagger-ui-container .swagger-ui .btn.cancel:hover {
          background: #475569 !important;
        }

        /* Responses */
        .swagger-ui-container .swagger-ui .response-col_status {
          color: #10b981 !important;
          font-weight: 600 !important;
        }

        .swagger-ui-container .swagger-ui .response-col_description {
          color: #e2e8f0 !important;
        }

        /* Models */
        .swagger-ui-container .swagger-ui .model {
          background: rgba(15, 15, 35, 0.8) !important;
          border: 1px solid rgba(139, 92, 246, 0.2) !important;
          border-radius: 6px !important;
        }

        .swagger-ui-container .swagger-ui .model-title {
          color: #8b5cf6 !important;
          font-weight: 600 !important;
        }

        .swagger-ui-container .swagger-ui .prop-type {
          color: #06b6d4 !important;
        }

        .swagger-ui-container .swagger-ui .prop-name {
          color: #e2e8f0 !important;
          font-weight: 500 !important;
        }

        .swagger-ui-container .swagger-ui .prop-format {
          color: #94a3b8 !important;
        }

        /* Markdown content */
        .swagger-ui-container .swagger-ui .renderedMarkdown p {
          color: #e2e8f0 !important;
        }

        .swagger-ui-container .swagger-ui .renderedMarkdown code {
          background: rgba(139, 92, 246, 0.1) !important;
          color: #8b5cf6 !important;
          padding: 0.2rem 0.4rem !important;
          border-radius: 4px !important;
        }

        /* Tabs */
        .swagger-ui-container .swagger-ui .tab {
          background: transparent !important;
          border: 1px solid rgba(139, 92, 246, 0.2) !important;
          color: #e2e8f0 !important;
          border-radius: 4px !important;
          margin-right: 0.5rem !important;
        }

        .swagger-ui-container .swagger-ui .tab.active {
          background: #8b5cf6 !important;
          color: white !important;
        }

        /* Input fields */
        .swagger-ui-container .swagger-ui input[type="text"],
        .swagger-ui-container .swagger-ui input[type="password"],
        .swagger-ui-container .swagger-ui textarea,
        .swagger-ui-container .swagger-ui select {
          background: rgba(15, 15, 35, 0.8) !important;
          border: 1px solid rgba(139, 92, 246, 0.2) !important;
          color: #e2e8f0 !important;
          border-radius: 4px !important;
        }

        .swagger-ui-container .swagger-ui input[type="text"]:focus,
        .swagger-ui-container .swagger-ui input[type="password"]:focus,
        .swagger-ui-container .swagger-ui textarea:focus,
        .swagger-ui-container .swagger-ui select:focus {
          border-color: #8b5cf6 !important;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2) !important;
        }

        /* Code blocks */
        .swagger-ui-container .swagger-ui .highlight-code {
          background: rgba(15, 15, 35, 0.9) !important;
          border: 1px solid rgba(139, 92, 246, 0.2) !important;
          border-radius: 6px !important;
        }

        .swagger-ui-container .swagger-ui .microlight {
          color: #e2e8f0 !important;
        }

        /* Authorization */
        .swagger-ui-container .swagger-ui .auth-container {
          background: rgba(26, 26, 46, 0.5) !important;
          border: 1px solid rgba(139, 92, 246, 0.2) !important;
          border-radius: 8px !important;
        }

        .swagger-ui-container .swagger-ui .auth-container .auth-wrapper {
          background: transparent !important;
        }

        /* Scrollbars */
        .swagger-ui-container .swagger-ui ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .swagger-ui-container .swagger-ui ::-webkit-scrollbar-track {
          background: rgba(15, 15, 35, 0.5);
          border-radius: 4px;
        }

        .swagger-ui-container .swagger-ui ::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 4px;
        }

        .swagger-ui-container .swagger-ui ::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7);
        }
      `}</style>
    </div>
  );
}
