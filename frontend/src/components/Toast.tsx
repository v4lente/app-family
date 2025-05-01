"use client";

import { createContext, useContext } from "react";
import { useFeedback, FeedbackItem } from "./Feedback";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const { showFeedback } = useFeedback();

  const showToast = (message: string, type: ToastType, duration = 5000) => {
    showFeedback(message, type, duration);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Os feedbacks são renderizados pelo componente Feedback */}
    </ToastContext.Provider>
  );
};

// Animation CSS (add to globals.css or a module if needed):
// .animate-fade-in-down {
//   animation: fadeInDown 0.4s;
// }
// @keyframes fadeInDown {
//   0% { opacity: 0; transform: translateY(-20px); }
//   100% { opacity: 1; transform: translateY(0); }
// }
