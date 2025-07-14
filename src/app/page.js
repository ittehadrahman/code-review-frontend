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
  Plus,
  Trash2,
  Mail,
  Hash,
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
    reviewerEmail: "",
    yearsOfExperience: "",
    position: "",
    generalComment: "",
  });

  const [lineReviews, setLineReviews] = useState([]);

  const categories = [
    "Bug/Error",
    "Performance",
    "Code Style",
    "Best Practices",
    "Security",
    "Functionality",
    "Debugging",
    "Refactoring",
    "Other",
  ];

  // Get code lines for display
  const getCodeLines = () => {
    if (!currentCode?.code) return [];
    return currentCode.code.split("\n");
  };

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
    if (!reviewForm.reviewerEmail.trim()) {
      setMessage({
        type: "error",
        text: "Please enter your email first to get a code for review.",
      });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const data = await apiRequest(
        `/codes/random?email=${encodeURIComponent(
          reviewForm.reviewerEmail.trim()
        )}`
      );
      setCurrentCode(data);
      setLineReviews([]);
      setMessage({ type: "success", text: "New code loaded successfully!" });
    } catch (error) {
      if (error.message.includes("404")) {
        setMessage({
          type: "error",
          text: "No codes available for review. You may have reviewed all available codes or all codes are completed.",
        });
      } else if (error.message.includes("400")) {
        setMessage({
          type: "error",
          text: "Please enter a valid email address.",
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

  // Add line review
  const addLineReview = () => {
    setLineReviews([
      ...lineReviews,
      {
        lineNumber: "",
        comment: "",
        category: "",
      },
    ]);
  };

  // Remove line review
  const removeLineReview = (index) => {
    setLineReviews(lineReviews.filter((_, i) => i !== index));
  };

  // Update line review
  const updateLineReview = (index, field, value) => {
    const updated = [...lineReviews];
    updated[index][field] = value;
    setLineReviews(updated);
  };

  // Submit review
  const submitReview = async () => {
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    // Client-side validation
    const errors = [];
    if (!reviewForm.reviewerName.trim()) errors.push("Reviewer name");
    if (!reviewForm.reviewerEmail.trim()) errors.push("Reviewer email");
    if (!reviewForm.yearsOfExperience || reviewForm.yearsOfExperience < 0)
      errors.push("Years of experience");
    if (!reviewForm.position.trim()) errors.push("Position");
    if (lineReviews.length === 0) errors.push("At least one line review");

    if (errors.length > 0) {
      setMessage({
        type: "error",
        text: `Please fill in: ${errors.join(", ")}`,
      });
      setSubmitting(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(reviewForm.reviewerEmail)) {
      setMessage({
        type: "error",
        text: "Please enter a valid email address",
      });
      setSubmitting(false);
      return;
    }

    // Validate line reviews
    for (let i = 0; i < lineReviews.length; i++) {
      const lineReview = lineReviews[i];
      if (
        !lineReview.lineNumber ||
        !lineReview.comment.trim() ||
        !lineReview.category
      ) {
        setMessage({
          type: "error",
          text: `Line review ${
            i + 1
          }: Please fill in line number, comment, and category`,
        });
        setSubmitting(false);
        return;
      }
      if (lineReview.comment.length < 10) {
        setMessage({
          type: "error",
          text: `Line review ${
            i + 1
          }: Comment must be at least 10 characters long`,
        });
        setSubmitting(false);
        return;
      }
      const lineNum = parseInt(lineReview.lineNumber);
      const codeLines = getCodeLines();
      if (lineNum < 1 || lineNum > codeLines.length) {
        setMessage({
          type: "error",
          text: `Line review ${i + 1}: Line number must be between 1 and ${
            codeLines.length
          }`,
        });
        setSubmitting(false);
        return;
      }
    }

    try {
      const reviewData = {
        codeId: currentCode._id,
        reviewerName: reviewForm.reviewerName.trim(),
        reviewerEmail: reviewForm.reviewerEmail.trim().toLowerCase(),
        yearsOfExperience: parseInt(reviewForm.yearsOfExperience),
        position: reviewForm.position.trim(),
        generalComment: reviewForm.generalComment.trim(),
        lineReviews: lineReviews.map((lr) => ({
          lineNumber: parseInt(lr.lineNumber),
          comment: lr.comment.trim(),
          category: lr.category,
        })),
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
            <div className="flex items-center space-x-3">
              <div className="bg-blue-50 px-4 py-2 rounded-lg">
                <span className="text-sm font-medium text-blue-700">
                  Reviews Submitted: {reviewCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome to the Code Review Platform
          </h2>
          <p className="text-gray-600 mb-4">
            Help improve code quality by providing line-by-line feedback on code
            snippets. Each code needs 3 reviews before completion. You can
            review each code only once.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Review code snippets randomly</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Provide line-by-line feedback</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>One review per code per user</span>
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
                  disabled={
                    loading ||
                    connectionStatus !== "connected" ||
                    !reviewForm.reviewerEmail.trim()
                  }
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      Line-by-Line Review Guidelines:
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>
                        • Click on line numbers to reference specific lines
                      </li>
                      <li>• Look for bugs, errors, or logical issues</li>
                      <li>• Check for performance improvements</li>
                      <li>• Evaluate code style and readability</li>
                      <li>• Consider security vulnerabilities</li>
                      <li>• Suggest best practices</li>
                    </ul>
                  </div>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>
                      {getCodeLines().map((line, index) => (
                        <div
                          key={index}
                          className="flex hover:bg-gray-800 cursor-pointer py-1"
                          onClick={() => {
                            const lineNum = index + 1;
                            if (
                              !lineReviews.find(
                                (lr) => lr.lineNumber === lineNum.toString()
                              )
                            ) {
                              const newLineReview = {
                                lineNumber: lineNum.toString(),
                                comment: "",
                                category: "",
                              };
                              setLineReviews([...lineReviews, newLineReview]);
                            }
                          }}
                        >
                          <span className="text-gray-400 mr-4 select-none w-8 text-right">
                            {index + 1}
                          </span>
                          <span className="flex-1">{line || " "}</span>
                        </div>
                      ))}
                    </code>
                  </div>
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
                  ) : !reviewForm.reviewerEmail.trim() ? (
                    "Please enter your email first, then click 'Get New Code'"
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
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">About You</h4>
                  <p className="text-sm text-blue-700">
                    Your background helps us understand the perspective of your
                    review. Email is used to ensure one review per code per
                    user.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Your Email *
                  </label>
                  <input
                    type="email"
                    name="reviewerEmail"
                    value={reviewForm.reviewerEmail}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email address"
                  />
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    General Comments (Optional)
                  </label>
                  <textarea
                    name="generalComment"
                    value={reviewForm.generalComment}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Overall thoughts about the code..."
                  />
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-800 mb-2">
                    Line-by-Line Reviews
                  </h4>
                  <p className="text-sm text-purple-700">
                    Add specific feedback for individual lines of code. You must
                    add at least one line review.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      Line Reviews *
                    </h4>
                    <button
                      onClick={addLineReview}
                      className="flex items-center space-x-1 px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Line Review</span>
                    </button>
                  </div>

                  {lineReviews.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                      <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No line reviews added yet</p>
                      <p className="text-sm">
                        Click "Add Line Review" or click on line numbers in the
                        code
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {lineReviews.map((lineReview, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-gray-900">
                              Review #{index + 1}
                            </h5>
                            <button
                              onClick={() => removeLineReview(index)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Line Number *
                              </label>
                              <input
                                type="number"
                                value={lineReview.lineNumber}
                                onChange={(e) =>
                                  updateLineReview(
                                    index,
                                    "lineNumber",
                                    e.target.value
                                  )
                                }
                                min="1"
                                max={getCodeLines().length}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Line #"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category *
                              </label>
                              <select
                                value={lineReview.category}
                                onChange={(e) =>
                                  updateLineReview(
                                    index,
                                    "category",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              >
                                <option value="">Select category</option>
                                {categories.map((category) => (
                                  <option key={category} value={category}>
                                    {category}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Comment *
                            </label>
                            <textarea
                              value={lineReview.comment}
                              onChange={(e) =>
                                updateLineReview(
                                  index,
                                  "comment",
                                  e.target.value
                                )
                              }
                              rows="3"
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Detailed feedback for this line..."
                            />
                            <div className="text-xs mt-1">
                              <span
                                className={
                                  lineReview.comment.length >= 10
                                    ? "text-green-600"
                                    : "text-red-500"
                                }
                              >
                                {lineReview.comment.length}/10 minimum
                                characters
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={submitReview}
                  disabled={
                    submitting ||
                    connectionStatus !== "connected" ||
                    !currentCode ||
                    lineReviews.length === 0
                  }
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
