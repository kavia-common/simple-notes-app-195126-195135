import React from "react";

/**
 * @param {{
 *  variant?: 'primary'|'secondary'|'danger'|'ghost',
 *  size?: 'sm'|'md',
 *  type?: 'button'|'submit'|'reset',
 *  disabled?: boolean,
 *  isLoading?: boolean,
 *  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void,
 *  children: React.ReactNode,
 *  title?: string,
 *  className?: string
 * }} props
 */
// PUBLIC_INTERFACE
export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  isLoading = false,
  onClick,
  children,
  title,
  className = ""
}) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${className}`.trim()}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      onClick={onClick}
      title={title}
    >
      {isLoading ? "Loading…" : children}
    </button>
  );
}
