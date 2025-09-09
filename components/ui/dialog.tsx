"use client";

import { createContext, useContext } from "react";
import { cn } from "@/lib/utils";

interface DialogContextType {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

interface DialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
	return (
		<DialogContext.Provider value={{ open, onOpenChange }}>
			{children}
		</DialogContext.Provider>
	);
}

interface DialogContentProps {
	children: React.ReactNode;
	className?: string;
}

export function DialogContent({ children, className }: DialogContentProps) {
	const context = useContext(DialogContext);
	if (!context?.open) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center"
			onClick={() => context.onOpenChange(false)}
		>
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/50" />

			{/* Content */}
			<div
				className={cn(
					"relative bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-auto",
					className
				)}
				onClick={(e) => e.stopPropagation()}
			>
				{children}
			</div>
		</div>
	);
}

interface DialogHeaderProps {
	children: React.ReactNode;
	className?: string;
}

export function DialogHeader({ children, className }: DialogHeaderProps) {
	return (
		<div className={cn("px-6 py-4 border-b border-gray-200", className)}>
			{children}
		</div>
	);
}

interface DialogTitleProps {
	children: React.ReactNode;
	className?: string;
}

export function DialogTitle({ children, className }: DialogTitleProps) {
	return (
		<h2 className={cn("text-lg font-semibold text-gray-900", className)}>
			{children}
		</h2>
	);
}

interface DialogDescriptionProps {
	children: React.ReactNode;
	className?: string;
}

export function DialogDescription({
	children,
	className,
}: DialogDescriptionProps) {
	return (
		<p className={cn("text-sm text-gray-600 mt-1", className)}>{children}</p>
	);
}

interface DialogFooterProps {
	children: React.ReactNode;
	className?: string;
}

export function DialogFooter({ children, className }: DialogFooterProps) {
	return (
		<div
			className={cn(
				"px-6 py-4 border-t border-gray-200 flex justify-end gap-2",
				className
			)}
		>
			{children}
		</div>
	);
}
