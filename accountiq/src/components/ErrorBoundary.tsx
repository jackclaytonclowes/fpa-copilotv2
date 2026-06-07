"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-500 text-sm mb-6 max-w-xs">
            There was a problem loading this content. Please go back and try
            again.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-teal-600 text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-teal-700 transition-colors"
          >
            Go back
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
