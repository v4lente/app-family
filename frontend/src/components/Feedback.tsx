"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type FeedbackType = "success" | "error" | "info" | "warning";

interface FeedbackProps {
  id?: number;
  message: string;
  type: FeedbackType;
  duration?: number;
  onClose?: () => void;
}

interface FeedbackContextType {
  showFeedback: (message: string, type: FeedbackType, duration?: number) => void;
}

const defaultContext: FeedbackContextType = {
  showFeedback: () => {},
};

export const useFeedback = (): FeedbackContextType => {
  const [feedbacks, setFeedbacks] = useState<FeedbackProps[]>([]);

  const showFeedback = (message: string, type: FeedbackType, duration = 3000) => {
    const id = Date.now();
    const newFeedback = { id, message, type, duration };
    setFeedbacks((prev) => [...prev, newFeedback]);

    setTimeout(() => {
      setFeedbacks((prev) => prev.filter((feedback) => feedback.id !== id));
    }, duration);
  };

  useEffect(() => {
    // Criar o container para os feedbacks se não existir
    let container = document.getElementById("feedback-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "feedback-container";
      container.style.position = "fixed";
      container.style.top = "20px";
      container.style.right = "20px";
      container.style.zIndex = "9999";
      document.body.appendChild(container);
    }

    return () => {
      const container = document.getElementById("feedback-container");
      if (container && container.childNodes.length === 0) {
        document.body.removeChild(container);
      }
    };
  }, []);

  // Renderizar os feedbacks
  const feedbackElements = feedbacks.map((feedback) => (
    <FeedbackItem
      key={feedback.id}
      message={feedback.message}
      type={feedback.type}
      duration={feedback.duration}
      onClose={() => setFeedbacks((prev) => prev.filter((f) => f.id !== feedback.id))}
    />
  ));

  // Usar portal para renderizar os feedbacks
  useEffect(() => {
    // Nada a fazer aqui, os portais são gerenciados pelo React
  }, [feedbacks]);

  // Renderizar os feedbacks usando portal
  let feedbackPortal = null;
  if (typeof window !== "undefined" && document.getElementById("feedback-container")) {
    feedbackPortal = createPortal(
      feedbackElements,
      document.getElementById("feedback-container")!
    );
  }

  return { showFeedback };
};

export function FeedbackItem({ message, type, duration = 3000, onClose }: FeedbackProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    const updateProgress = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const newProgress = (remaining / duration) * 100;
      setProgress(newProgress);
      
      if (newProgress > 0) {
        requestAnimationFrame(updateProgress);
      } else {
        setIsVisible(false);
        // Verificar se onClose existe antes de chamar
        if (typeof onClose === 'function') {
          setTimeout(() => onClose(), 300); // Dar tempo para a animação de saída
        }
      }
    };
    
    const progressInterval = requestAnimationFrame(updateProgress);
    
    return () => {
      cancelAnimationFrame(progressInterval);
    };
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-100 border-green-500 text-green-700";
      case "error":
        return "bg-red-100 border-red-500 text-red-700";
      case "warning":
        return "bg-yellow-100 border-yellow-500 text-yellow-700";
      case "info":
      default:
        return "bg-blue-100 border-blue-500 text-blue-700";
    }
  };

  const getIconByType = () => {
    switch (type) {
      case "success":
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case "error":
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case "warning":
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case "info":
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`max-w-sm w-full shadow-lg rounded-lg pointer-events-auto mb-3 border-l-4 overflow-hidden transition-all duration-300 transform ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      } ${getTypeStyles()}`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIconByType()}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
            >
              <span className="sr-only">Fechar</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div 
        className={`h-1 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`}
        style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
      />
    </div>
  );
}

export default function FeedbackProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
