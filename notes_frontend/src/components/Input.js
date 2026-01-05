import React from "react";

/**
 * @param {{
 *  label: string,
 *  value: string,
 *  onChange: (v: string) => void,
 *  placeholder?: string,
 *  name?: string,
 *  required?: boolean,
 *  disabled?: boolean,
 *  autoFocus?: boolean,
 *  maxLength?: number
 * }} props
 */
// PUBLIC_INTERFACE
export function Input({
  label,
  value,
  onChange,
  placeholder,
  name,
  required = false,
  disabled = false,
  autoFocus = false,
  maxLength
}) {
  const id = name || `input-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <label className="field" htmlFor={id}>
      <div className="field-label">
        {label}
        {required ? <span className="field-required"> *</span> : null}
      </div>
      <input
        id={id}
        name={name}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        maxLength={maxLength}
      />
    </label>
  );
}
