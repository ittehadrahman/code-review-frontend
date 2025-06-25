"use client";
import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  Code,
  Plus,
  Upload,
  CheckCircle,
  BarChart3,
  RefreshCw,
  Download,
  Loader2,
  FileText,
  Database,
  Eye,
} from "lucide-react";

// API configuration
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Enhanced fetch wrapper with error handling
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  console.log(`Making ${config.method || "GET"} request to: ${url}`);

  try {
    const response = await fetch(url, config);

    // Handle different response types
    if (options.responseType === "blob") {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.blob();
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || data.message || `HTTP error! status: ${response.status}`
      );
    }

    console.log(`Response from ${url}:`, response.status);
    return data;
  } catch (error) {
    console.error(`Error with ${url}:`, error.message);
    throw error;
  }
};

export default function InsertCodePage() {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingStats, setFetchingStats] = useState(false);
  const [fetchingCodes, setFetchingCodes] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("single");
  const [connectionStatus, setConnectionStatus] = useState("checking");

  const [stats, setStats] = useState({
    totalCodes: 0,
    totalReviews: 0,
    completedCodes: 0,
    pendingCodes: 0,
  });

  const [allCodes, setAllCodes] = useState([]);
  const [showCodeDetails, setShowCodeDetails] = useState(null);

  // Single code form
  const [singleCodeForm, setSingleCodeForm] = useState({
    title: "",
    code: "",
    language: "",
    maxReviews: 3,
  });

  // Bulk codes form
  const [bulkCodesText, setBulkCodesText] = useState("");

  const languages = [
    "JavaScript",
    "Python",
    "Java",
    "C++",
    "C#",
    "PHP",
    "Ruby",
    "Go",
    "Rust",
    "TypeScript",
    "Swift",
    "Kotlin",
    "SQL",
    "HTML/CSS",
    "Other",
  ];

  // Check API connection
  const checkConnection = async () => {
    try {
      setConnectionStatus("checking");
      await apiRequest("/health");
      setConnectionStatus("connected");
      setMessage({ type: "", text: "" });
    } catch (error) {
      setConnectionStatus("disconnected");
      setMessage({
        type: "error",
        text: "Cannot connect to backend server. Please check if the server is running.",
      });
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    setFetchingStats(true);
    try {
      const data = await apiRequest("/stats");
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setFetchingStats(false);
    }
  };

  // Fetch all codes
  const fetchAllCodes = async () => {
    setFetchingCodes(true);
    try {
      const data = await apiRequest("/codes");
      setAllCodes(data);
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to fetch codes. Please try again.",
      });
    } finally {
      setFetchingCodes(false);
    }
  };

  // Submit single code
  const submitSingleCode = async () => {
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    // Validation
    const errors = [];
    if (!singleCodeForm.title.trim()) errors.push("Title");
    if (!singleCodeForm.code.trim()) errors.push("Code");
    if (!singleCodeForm.language) errors.push("Language");

    if (errors.length > 0) {
      setMessage({
        type: "error",
        text: `Please fill in: ${errors.join(", ")}`,
      });
      setSubmitting(false);
      return;
    }

    try {
      await apiRequest("/codes", {
        method: "POST",
        body: JSON.stringify({
          title: singleCodeForm.title.trim(),
          code: singleCodeForm.code.trim(),
          language: singleCodeForm.language,
          maxReviews: parseInt(singleCodeForm.maxReviews),
        }),
      });

      setMessage({
        type: "success",
        text: "Code added successfully!",
      });

      // Reset form
      setSingleCodeForm({
        title: "",
        code: "",
        language: "",
        maxReviews: 3,
      });

      // Refresh stats
      fetchStats();
      if (activeTab === "manage") {
        fetchAllCodes();
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Failed to add code. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit bulk codes
  const submitBulkCodes = async () => {
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    if (!bulkCodesText.trim()) {
      setMessage({
        type: "error",
        text: "Please enter codes in JSON format",
      });
      setSubmitting(false);
      return;
    }

    try {
      const parsedCodes = JSON.parse(bulkCodesText);

      if (!Array.isArray(parsedCodes)) {
        throw new Error("Input must be an array of code objects");
      }

      const response = await apiRequest("/codes/bulk", {
        method: "POST",
        body: JSON.stringify({ codes: parsedCodes }),
      });

      setMessage({
        type: "success",
        text: `${response.addedCount} codes added successfully!`,
      });

      // Clear form
      setBulkCodesText("");

      // Refresh stats
      fetchStats();
      if (activeTab === "manage") {
        fetchAllCodes();
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        setMessage({
          type: "error",
          text: "Invalid JSON format. Please check your input.",
        });
      } else {
        setMessage({
          type: "error",
          text: error.message || "Failed to add codes. Please try again.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Export reviews as CSV
  const exportReviews = async () => {
    try {
      setMessage({ type: "info", text: "Preparing CSV export..." });

      const blob = await apiRequest("/reviews/export", {
        responseType: "blob",
      });

      // Create blob link to download file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `code_reviews_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage({ type: "success", text: "Reviews exported successfully!" });
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to export reviews. Please try again.",
      });
    }
  };

  // Handle single code form changes
  const handleSingleCodeChange = (e) => {
    const { name, value } = e.target;
    setSingleCodeForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Sample bulk data generator
  const generateSampleBulkData = () => {
    const sampleData = [
      {
        title: "Fibonacci Sequence Generator",
        language: "Python",
        code: "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nfor i in range(10):\n    print(fibonacci(i))",
        maxReviews: 3,
      },
      {
        title: "Binary Search Implementation",
        language: "JavaScript",
        code: "function binarySearch(arr, target) {\n    let left = 0;\n    let right = arr.length - 1;\n    \n    while (left <= right) {\n        let mid = Math.floor((left + right) / 2);\n        if (arr[mid] === target) return mid;\n        if (arr[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}",
        maxReviews: 3,
      },
    ];
    setBulkCodesText(JSON.stringify(sampleData, null, 2));
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Initialize app
  useEffect(() => {
    checkConnection();
    fetchStats();
  }, []);

  // Fetch codes when manage tab is active
  useEffect(() => {
    if (activeTab === "manage" && connectionStatus === "connected") {
      fetchAllCodes();
    }
  }, [activeTab, connectionStatus]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Database className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Code Management Dashboard
              </h1>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    connectionStatus === "connected"
                      ? "bg-green-500"
                      : connectionStatus === "disconnected"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                  }`}
                />
                <span className="text-sm text-gray-600">
                  {connectionStatus === "connected"
                    ? "Connected"
                    : connectionStatus === "disconnected"
                    ? "Disconnected"
                    : "Checking..."}
                </span>
                {connectionStatus === "disconnected" && (
                  <button
                    onClick={checkConnection}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportReviews}
                disabled={connectionStatus !== "connected"}
                className="flex items-center space-x-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <Download className="h-5 w-5" />
                <span>Export Reviews CSV</span>
              </button>
              <button
                onClick={fetchStats}
                disabled={fetchingStats || connectionStatus !== "connected"}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <BarChart3 className="h-5 w-5" />
                <span>Refresh Stats</span>
                {fetchingStats && <Loader2 className="h-4 w-4 animate-spin" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* API Configuration Info */}
        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center space-x-2 text-sm text-purple-700">
            <Database className="h-4 w-4" />
            <span>
              API Endpoint:{" "}
              <code className="bg-purple-100 px-1 rounded">{API_BASE_URL}</code>
            </span>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Platform Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalCodes}
              </div>
              <div className="text-sm text-gray-600">Total Codes</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats.totalReviews}
              </div>
              <div className="text-sm text-gray-600">Total Reviews</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {stats.completedCodes}
              </div>
              <div className="text-sm text-gray-600">Completed Codes</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {stats.pendingCodes}
              </div>
              <div className="text-sm text-gray-600">Pending Codes</div>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : message.type === "info"
                ? "bg-blue-50 text-blue-800 border border-blue-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("single")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "single"
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Add Single Code
              </button>
              <button
                onClick={() => setActiveTab("bulk")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "bulk"
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Upload className="h-4 w-4 inline mr-2" />
                Bulk Import
              </button>
              <button
                onClick={() => setActiveTab("manage")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "manage"
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <FileText className="h-4 w-4 inline mr-2" />
                Manage Codes
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Single Code Tab */}
            {activeTab === "single" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">
                  Add Single Code Snippet
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={singleCodeForm.title}
                      onChange={handleSingleCodeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Bubble Sort Algorithm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Programming Language *
                    </label>
                    <select
                      name="language"
                      value={singleCodeForm.language}
                      onChange={handleSingleCodeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select Language</option>
                      {languages.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Reviews
                  </label>
                  <input
                    type="number"
                    name="maxReviews"
                    value={singleCodeForm.maxReviews}
                    onChange={handleSingleCodeChange}
                    min="1"
                    max="10"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-500 ml-2">
                    (Recommended: 3)
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code Content *
                  </label>
                  <textarea
                    name="code"
                    value={singleCodeForm.code}
                    onChange={handleSingleCodeChange}
                    rows="15"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                    placeholder="Paste your code here..."
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Characters: {singleCodeForm.code.length}
                  </div>
                </div>

                <button
                  onClick={submitSingleCode}
                  disabled={submitting || connectionStatus !== "connected"}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Adding Code...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      <span>Add Code</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Bulk Import Tab */}
            {activeTab === "bulk" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Bulk Import Codes</h3>
                  <button
                    onClick={generateSampleBulkData}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    Load Sample Data
                  </button>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">
                    JSON Format Required:
                  </h4>
                  <pre className="text-sm text-yellow-700 bg-yellow-100 p-2 rounded">
                    {`[
  {
    "title": "Code Title",
    "language": "JavaScript",
    "code": "function example() { ... }",
    "maxReviews": 3
  }
]`}
                  </pre>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    JSON Data *
                  </label>
                  <textarea
                    value={bulkCodesText}
                    onChange={(e) => setBulkCodesText(e.target.value)}
                    rows="20"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                    placeholder="Paste your JSON array of code objects here..."
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Characters: {bulkCodesText.length}
                  </div>
                </div>

                <button
                  onClick={submitBulkCodes}
                  disabled={submitting || connectionStatus !== "connected"}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Importing Codes...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      <span>Import Codes</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Manage Codes Tab */}
            {activeTab === "manage" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Manage Existing Codes
                  </h3>
                  <button
                    onClick={fetchAllCodes}
                    disabled={fetchingCodes}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        fetchingCodes ? "animate-spin" : ""
                      }`}
                    />
                    <span>Refresh</span>
                  </button>
                </div>

                {fetchingCodes ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
                    <p className="text-gray-600">Loading codes...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allCodes.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No codes found. Add some codes to get started.</p>
                      </div>
                    ) : (
                      allCodes.map((code) => (
                        <div
                          key={code._id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">
                                {code.title}
                              </h4>
                              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                                <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                  {code.language}
                                </span>
                                <span>
                                  Reviews: {code.reviewCount}/{code.maxReviews}
                                </span>
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
                                    code.isCompleted
                                      ? "bg-green-100 text-green-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {code.isCompleted ? "Completed" : "Pending"}
                                </span>
                                <span className="text-xs text-gray-400 font-mono">
                                  {code._id}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                setShowCodeDetails(
                                  showCodeDetails === code._id ? null : code._id
                                )
                              }
                              className="flex items-center space-x-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                              <span>
                                {showCodeDetails === code._id ? "Hide" : "View"}
                              </span>
                            </button>
                          </div>
                          {showCodeDetails === code._id && (
                            <div className="mt-4 pt-4 border-t">
                              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                                <code>{code.code}</code>
                              </pre>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
