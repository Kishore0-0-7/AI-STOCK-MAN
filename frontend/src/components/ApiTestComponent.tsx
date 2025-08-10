import React, { useState, useEffect } from "react";
import { healthCheck, dashboardAPI, productsAPI } from "../services/api";

const ApiTestComponent: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<string>("Checking...");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [productsData, setProductsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const testApiConnection = async () => {
    try {
      setLoading(true);
      setError(null);

      // Test health check
      const health = await healthCheck();
      setHealthStatus(
        health.status === "connected" ? "✅ Connected" : "❌ Disconnected"
      );

      // Test dashboard API
      try {
        const dashboard = await dashboardAPI.getOverview();
        setDashboardData(dashboard);
      } catch (err) {
        console.log("Dashboard API not ready yet");
        setDashboardData({
          message:
            "Dashboard API not responding (this is normal if DB is empty)",
        });
      }

      // Test products API
      try {
        const products = await productsAPI.getAll();
        setProductsData(products);
      } catch (err) {
        console.log("Products API not ready yet");
        setProductsData({
          message:
            "Products API not responding (this is normal if DB is empty)",
        });
      }
    } catch (err) {
      setError(
        `Connection failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testApiConnection();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto mt-6">
      <h2 className="text-2xl font-bold mb-4 text-center">
        🔌 Backend API Connection Test
      </h2>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold text-lg mb-2">Health Check Status</h3>
          <p className="text-lg">{healthStatus}</p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2">Testing API connections...</p>
          </div>
        ) : (
          <>
            {error ? (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <h3 className="font-semibold">❌ Connection Error</h3>
                <p>{error}</p>
                <p className="mt-2 text-sm">
                  Make sure your backend server is running on port 4000:
                  <br />
                  <code className="bg-red-200 px-2 py-1 rounded">
                    cd backend && npm start
                  </code>
                </p>
              </div>
            ) : (
              <>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">
                    Dashboard API Response
                  </h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-32">
                    {JSON.stringify(dashboardData, null, 2)}
                  </pre>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">
                    Products API Response
                  </h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-32">
                    {JSON.stringify(productsData, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </>
        )}

        <div className="flex justify-center space-x-4 mt-6">
          <button
            onClick={testApiConnection}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Testing..." : "🔄 Retry Connection"}
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">
            📋 Backend Setup Instructions
          </h3>
          <div className="text-blue-700 text-sm space-y-1">
            <p>
              1. Navigate to backend directory:{" "}
              <code className="bg-blue-100 px-1 rounded">cd backend/</code>
            </p>
            <p>
              2. Run setup script:{" "}
              <code className="bg-blue-100 px-1 rounded">./setup.sh</code>
            </p>
            <p>
              3. Start server:{" "}
              <code className="bg-blue-100 px-1 rounded">npm start</code>
            </p>
            <p>
              4. Backend should be running on:{" "}
              <code className="bg-blue-100 px-1 rounded">
                http://localhost:4000
              </code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTestComponent;
