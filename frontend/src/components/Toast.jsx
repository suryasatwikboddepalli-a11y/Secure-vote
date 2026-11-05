import React, { useEffect } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export default function Toast({ message, type = "info", onClose, duration = 5000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === "success";
  const isError = type === "error";

  return (
    <div className={`toast-notification toast-${type}`}>
      <div className="toast-icon">
        {isSuccess && <CheckCircle2 size={18} className="text-emerald-500" />}
        {isError && <AlertTriangle size={18} className="text-rose-500" />}
        {!isSuccess && !isError && <Info size={18} className="text-indigo-500" />}
      </div>
      <div className="toast-content">
        <span className="toast-title">
          {isSuccess ? "Transaction Confirmed" : isError ? "Action Failed" : "Notification"}
        </span>
        <span className="toast-message">{message}</span>
      </div>
      <button className="toast-close" onClick={onClose} aria-label="Close notification">
        <X size={15} />
      </button>
    </div>
  );
}
