"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ModalProps {
  open:     boolean;
  onClose?: () => void;
  title?:   string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={cn(
              "fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            )}
          >
            <div
              className={cn(
                "pointer-events-auto glass rounded-3xl p-8 w-full max-w-md mx-4",
                "border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.8)]",
                className
              )}
            >
              {title && (
                <h2 className="font-display text-2xl font-bold text-white mb-6 text-center">
                  {title}
                </h2>
              )}
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
