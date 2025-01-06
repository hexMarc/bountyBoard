"use client";

import React from "react";
import { twMerge } from "tailwind-merge";
import { Loading } from "./Loading";

type ButtonProps = {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = ({
  children,
  loading,
  disabled,
  className,
  ...props
}: ButtonProps) => {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={twMerge(
        "flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300",
        className
      )}
    >
      {loading ? <Loading className="h-4 w-4 border-2" /> : null}
      {children}
    </button>
  );
};
