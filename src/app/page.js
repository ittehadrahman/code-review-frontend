"use client";
import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  Code,
  User,
  Clock,
  MessageSquare,
  CheckCircle,
  RefreshCw,
  Loader2,
  Settings,
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

export default function CodeReviewPage() {
  const [currentCode, setCurrentCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [connectionStatus, setConnectionStatus] = useState("checking");
  const [reviewCount, setReviewCount] = useState(0);

  const [reviewForm, setReviewForm] = useState({
    reviewerName: "",
    yearsOfExperience: "",
    position: "",
    reviewComment: "",
    category: "",
  });

  const categories = [
    "Bug/Error",
    "Performance",
    "Code Style",
    "Best Practices",
    "Security",
    "Functionality",
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

  // Fetch random code
  const fetchRandomCode = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const data = await apiRequest("/codes/random");
      setCurrentCode(data);
      setReviewForm({
        reviewerName: "",
        yearsOfExperience: "",
        position: "",
        reviewComment: "",
        category: "",
      });
      setMessage({ type: "success", text: "New code loaded successfully!" });
    } catch (error) {
      if (error.message.includes("404")) {
        setMessage({
          type: "error",
          text: "No codes available for review. All codes may have been completed.",
        });
      } else if (
        error.name === "TypeError" &&
        error.message.includes("fetch")
      ) {
        setMessage({
          type: "error",
          text: "Network error. Please check your internet connection and server status.",
        });
      } else {
        setMessage({
          type: "error",
          text: error.message || "Failed to fetch code. Please try again.",
        });
      }
      setCurrentCode(null);
    } finally {
      setLoading(false);
    }
  };

  // Submit review
  const submitReview = async () => {
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    // Client-side validation
    const errors = [];
    if (!reviewForm.reviewerName.trim()) errors.push("Reviewer name");
    if (!reviewForm.yearsOfExperience || reviewForm.yearsOfExperience < 0)
      errors.push("Years of experience");
    if (!reviewForm.position.trim()) errors.push("Position");
    if (!reviewForm.reviewComment.trim()) errors.push("Review comment");
    if (!reviewForm.category) errors.push("Category");

    if (errors.length > 0) {
      setMessage({
        type: "error",
        text: `Please fill in: ${errors.join(", ")}`,
      });
      setSubmitting(false);
      return;
    }

    if (reviewForm.reviewComment.length < 10) {
      setMessage({
        type: "error",
        text: "Review comment must be at least 10 characters long",
      });
      setSubmitting(false);
      return;
    }

    try {
      const reviewData = {
        codeId: currentCode._id,
        reviewerName: reviewForm.reviewerName.trim(),
        yearsOfExperience: parseInt(reviewForm.yearsOfExperience),
        position: reviewForm.position.trim(),
        reviewComment: reviewForm.reviewComment.trim(),
        category: reviewForm.category,
      };

      await apiRequest("/reviews", {
        method: "POST",
        body: JSON.stringify(reviewData),
      });

      setMessage({
        type: "success",
        text: "Review submitted successfully! Loading next code...",
      });

      // Increment review count
      setReviewCount((prev) => prev + 1);

      // Auto-fetch next code after 2 seconds
      setTimeout(() => {
        fetchRandomCode();
      }, 2000);
    } catch (error) {
      if (error.message.includes("400")) {
        setMessage({
          type: "error",
          text:
            error.message || "Invalid review data. Please check your inputs.",
        });
      } else if (error.message.includes("404")) {
        setMessage({
          type: "error",
          text: "Code not found. It may have been completed by other reviewers.",
        });
        // Fetch new code since this one is no longer available
        setTimeout(() => {
          fetchRandomCode();
        }, 3000);
      } else {
        setMessage({
          type: "error",
          text: error.message || "Failed to submit review. Please try again.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReviewForm((prev) => ({
      ...prev,
      [name]: value,
    }));
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
  }, []);

  // Auto-fetch first code when connection is established
  useEffect(() => {
    if (connectionStatus === "connected" && !currentCode && !loading) {
      fetchRandomCode();
    }
  }, [connectionStatus]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Code className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Code Review Platform
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
            {/* <div className="flex items-center space-x-3">
              <div className="bg-blue-50 px-4 py-2 rounded-lg">
                <span className="text-sm font-medium text-blue-700">
                  Reviews Submitted: {reviewCount}
                </span>
              </div>
              <a
                href="/admin"
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span>Admin Panel</span>
              </a>
            </div> */}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* API Configuration Info */}
        {/* <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2 text-sm text-blue-700">
            <Code className="h-4 w-4" />
            <span>
              API Endpoint:{" "}
              <code className="bg-blue-100 px-1 rounded">{API_BASE_URL}</code>
            </span>
          </div>
        </div> */}

        {/* Welcome Message */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome to the Code Review Platform
          </h2>
          <p className="text-gray-600 mb-4">
            Help improve code quality by providing detailed feedback on code
            snippets. Each code needs 3 reviews before completion.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Review code snippets randomly</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Provide constructive feedback</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Help build better software</span>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Code Display */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center">
                  <Code className="h-5 w-5 mr-2" />
                  Code to Review
                </h2>
                <button
                  onClick={fetchRandomCode}
                  disabled={loading || connectionStatus !== "connected"}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span>{loading ? "Loading..." : "Get New Code"}</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              {currentCode ? (
                <div>
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {currentCode.title}
                    </h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {currentCode.language}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Reviews: {currentCode.reviewCount}/
                        {currentCode.maxReviews}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        ID: {currentCode._id}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-800 mb-2">
                      Review Guidelines:
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Look for bugs, errors, or logical issues</li>
                      <li>• Check for performance improvements</li>
                      <li>• Evaluate code style and readability</li>
                      <li>• Consider security vulnerabilities</li>
                      <li>• Suggest best practices</li>
                    </ul>
                  </div>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{currentCode.code}</code>
                  </pre>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading code...</span>
                    </div>
                  ) : connectionStatus !== "connected" ? (
                    "Please check your connection to the backend server"
                  ) : (
                    'Click "Get New Code" to start reviewing'
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Review Form */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Submit Your Review
              </h2>
            </div>

            <div className="p-6">
              {currentCode ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">
                      About You
                    </h4>
                    <p className="text-sm text-blue-700">
                      Your background helps us understand the perspective of
                      your review.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="h-4 w-4 inline mr-1" />
                      Your Name *
                    </label>
                    <input
                      type="text"
                      name="reviewerName"
                      value={reviewForm.reviewerName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Programming Experience *
                    </label>
                    <input
                      type="number"
                      name="yearsOfExperience"
                      value={reviewForm.yearsOfExperience}
                      onChange={handleInputChange}
                      required
                      min="0"
                      max="50"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Role/Position *
                    </label>
                    <input
                      type="text"
                      name="position"
                      value={reviewForm.position}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Senior Developer, Student, Tech Lead"
                    />
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium text-purple-800 mb-2">
                      Your Review
                    </h4>
                    <p className="text-sm text-purple-700">
                      Provide detailed, constructive feedback to help improve
                      the code.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Category *
                    </label>
                    <select
                      name="category"
                      value={reviewForm.category}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">What aspect are you reviewing?</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Detailed Review Comments *
                    </label>
                    <textarea
                      name="reviewComment"
                      value={reviewForm.reviewComment}
                      onChange={handleInputChange}
                      required
                      rows="6"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Provide specific, actionable feedback. What works well? What could be improved? Any suggestions?"
                    />
                    <div className="flex justify-between text-xs mt-1">
                      <span
                        className={
                          reviewForm.reviewComment.length >= 10
                            ? "text-green-600"
                            : "text-red-500"
                        }
                      >
                        {reviewForm.reviewComment.length}/10 minimum characters
                      </span>
                      <span className="text-gray-500">
                        Be specific and constructive
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={submitReview}
                    disabled={submitting || connectionStatus !== "connected"}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Submitting Review...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        <span>Submit Review</span>
                      </>
                    )}
                  </button>

                  <div className="text-center text-sm text-gray-500">
                    Thank you for contributing to better code quality! 🚀
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">
                    Load a code snippet first to start reviewing
                  </p>
                  <p className="text-sm">
                    Your expertise helps improve code quality for everyone
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
