"use client";

import { ReactNode } from "react";

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  onClick?: () => void;
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={className} data-value={value} data-onchange={onValueChange}>
      {children}
    </div>
  );
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div className={`flex p-1 bg-gray-100 rounded-lg ${className || ""}`}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, onClick }: TabsTriggerProps) {
  return (
    <button
      className="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  return <div className={className}>{children}</div>;
}