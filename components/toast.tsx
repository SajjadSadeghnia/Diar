"use client";

import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  type: ToastType;
  message: string;
  duration?: number;
  onClose?: () => void;
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    className: "bg-emerald-50 border-emerald-200 text-emerald-800",
    iconClassName: "text-emerald-600",
  },
  error: {
    icon: XCircle,
    className: "bg-rose-50 border-rose-200 text-rose-800",
    iconClassName: "text-rose-600",
  },
  warning: {
    icon: AlertCircle,
    className: "bg-amber-50 border-amber-200 text-amber-800",
    iconClassName: "text-amber-600",
  },
  info: {
    icon: AlertCircle,
    className: "bg-blue-50 border-blue-200 text-blue-800",
    iconClassName: "text-blue-600",
  },
};

export function Toast({ type, message, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const config = toastConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsAnimating(true);
        setTimeout(() => {
          setIsVisible(false);
          onClose?.();
        }, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg transition-all duration-300",
        config.className,
        isAnimating ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0"
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", config.iconClassName)} />
      <div className="flex-1 text-sm font-medium">{message}</div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 rounded-lg p-1 hover:bg-black/10 transition-colors"
        aria-label="بستن"
      >
        <X className="h-4 w-4 opacity-60" />
      </button>
    </div>
  );
}

// Toast container for managing multiple toasts
export function ToastContainer({ toasts }: { toasts: Array<{ id: string; type: ToastType; message: string }> }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={() => {
            // Handle toast removal
          }}
        />
      ))}
    </div>
  );
}
