// src/components/ui/Modal.tsx
import React, { useEffect, useRef } from "react";
import MaterialIcon from "./MaterialIcon";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  showFooter?: boolean;
  primaryButtonText?: string;
  onPrimaryAction?: () => void;
  secondaryButtonText?: string;
  onSecondaryAction?: () => void;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnClickOutside?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  showFooter = true,
  primaryButtonText = "Confirm",
  onPrimaryAction,
  secondaryButtonText = "Cancel",
  onSecondaryAction,
  size = "md",
  closeOnClickOutside = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle Escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.classList.add("overflow-hidden"); // Prevent scrolling when modal is open
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen, onClose]);

  // Handle outside click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnClickOutside && modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Determine modal width based on size
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Background overlay - separate from the content container */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity z-40"
        aria-hidden="true"
      />

      {/* Modal container - positioned above the overlay */}
      <div
        className="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
        onClick={handleBackdropClick}
      >
        <div className="flex items-center justify-center min-h-screen p-4">
          {/* Modal panel */}
          <div
            ref={modalRef}
            className={`bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all relative ${sizeClasses[size]} w-full mx-auto`}
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside from triggering backdrop click
          >
            {/* Modal header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3
                className="text-lg leading-6 font-medium text-gray-900"
                id="modal-title"
              >
                {title}
              </h3>
              <button
                type="button"
                className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <MaterialIcon icon="close" className="h-6 w-6" />
              </button>
            </div>

            {/* Modal content */}
            <div className="p-6">{children}</div>

            {/* Modal footer */}
            {showFooter && (
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row">
                {onPrimaryAction && (
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={onPrimaryAction}
                  >
                    {primaryButtonText}
                  </button>
                )}
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={onSecondaryAction || onClose}
                >
                  {secondaryButtonText}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
