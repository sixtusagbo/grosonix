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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading API Documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {spec ? (
        <SwaggerUI
          spec={spec}
          docExpansion="list"
          defaultModelsExpandDepth={2}
          tryItOutEnabled={true}
          displayRequestDuration={true}
          filter={true}
          showExtensions={true}
          showCommonExtensions={true}
        />
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-600 text-lg">
              Failed to load API documentation
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
