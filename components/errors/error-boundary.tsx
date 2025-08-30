"use client";

import type React from "react";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
	children: ReactNode;
	fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
	fallbackMessage?: string;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
	hasError: boolean;
	error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		// Update state so the next render will show the fallback UI
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// Call the onError callback if provided
		this.props.onError?.(error, errorInfo);

		// Log error details only in development
		if (process.env.NODE_ENV === "development") {
			console.error("ErrorBoundary caught an error:", error, errorInfo);
		}
	}

	resetError = () => {
		this.setState({ hasError: false, error: undefined });
	};

	render() {
		if (this.state.hasError) {
			// Custom fallback component
			if (this.props.fallback) {
				const FallbackComponent = this.props.fallback;
				return (
					<FallbackComponent
						error={this.state.error!}
						resetError={this.resetError}
					/>
				);
			}

			// Default fallback UI
			return (
				<div className="error-boundary-fallback" role="alert">
					<h2>{this.props.fallbackMessage || "Something went wrong"}</h2>
					<button
						onClick={this.resetError}
						type="button"
						className="error-boundary-retry-button"
					>
						Try again
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}
