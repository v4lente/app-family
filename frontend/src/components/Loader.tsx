"use client";

import React from "react";

interface LoaderProps {
  size?: "small" | "medium" | "large";
  color?: "primary" | "secondary" | "white";
  fullScreen?: boolean;
  text?: string;
}

export default function Loader({
  size = "medium",
  color = "primary",
  fullScreen = false,
  text,
}: LoaderProps) {
  const getSize = () => {
    switch (size) {
      case "small":
        return "w-5 h-5";
      case "large":
        return "w-12 h-12";
      case "medium":
      default:
        return "w-8 h-8";
    }
  };

  const getColor = () => {
    switch (color) {
      case "secondary":
        return "border-gray-300 border-t-gray-600";
      case "white":
        return "border-gray-200 border-t-white";
      case "primary":
      default:
        return "border-gray-200 border-t-blue-600";
    }
  };

  const loader = (
    <div className={`flex flex-col items-center justify-center ${fullScreen ? "fixed inset-0 bg-white bg-opacity-80 z-50" : ""}`}>
      <div
        className={`${getSize()} ${getColor()} rounded-full animate-spin border-4`}
        role="status"
      />
      {text && <p className="mt-3 text-sm text-gray-700">{text}</p>}
    </div>
  );

  return loader;
}

export function PageLoader({ text = "Carregando..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px]">
      <Loader size="large" text={text} />
    </div>
  );
}

export function ButtonLoader({ size = "small", color = "white" }: { size?: "small" | "medium"; color?: "primary" | "secondary" | "white" }) {
  return <Loader size={size} color={color} />;
}

export function OverlayLoader({ text }: { text?: string }) {
  return <Loader fullScreen size="large" text={text} />;
}
