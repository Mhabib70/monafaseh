"use client";

import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console for debugging — this is the only way to see the actual
    // error in production, since Next.js wraps it as "client-side exception".
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
  }

  handleReload = () => {
    // Hard reload to clear in-memory state
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-[60vh] place-items-center p-6">
          <div className="mx-auto max-w-md text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-noor-coral" />
            <h2 className="font-display text-2xl text-noor-navy dark:text-white">
              خطایی رخ داد
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              لطفاً صفحه را تازه‌سازی کنید. اگر خطا ادامه داشت، اطلاعات زیر را برای پشتیبانی ارسال کنید:
            </p>
            <details className="mt-3 rounded-xl bg-muted/30 p-3 text-right text-xs text-muted-foreground">
              <summary className="cursor-pointer font-bold">
                جزئیات خطا
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-all">
                {this.state.error?.name}: {this.state.error?.message}
                {"\n\n"}
                {this.state.error?.stack}
              </pre>
            </details>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={this.handleReset}
                className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-noor-navy dark:text-white"
              >
                بستن
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 rounded-full bg-noor-yellow px-4 py-2 text-sm font-bold text-noor-navy"
              >
                <RefreshCw className="h-4 w-4" />
                رفرش صفحه
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
