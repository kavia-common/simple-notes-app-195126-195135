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
 *  rows?: number,
 *  maxLength?: number
 * }} props
 */
// PUBLIC_INTERFACE
export function Textarea({
  label,
  value,
  onChange,
  placeholder,
  name,
  required = false,
  disabled = false,
  rows = 10,
  maxLength
}) {
  const id = name || `textarea-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <label className="field" htmlFor={id}>
      <div className="field-label">
        {label}
        {required ? <span className="field-required"> *</span> : null}
      </div>
      <textarea
        id={id}
        name={name}
        className="textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
      />
    </label>
  );
}
