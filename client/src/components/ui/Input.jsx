import React from "react";

export default function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  as = "input",
  rows = 4,
  className = "",
  error,
  ...rest
}) {
  const classNames = ["ui-input", className, error ? "ui-input--error" : ""].filter(Boolean).join(" ");

  if (as === "textarea") {
    return (
      <textarea
        className={classNames}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...rest}
      />
    );
  }

  return (
    <input
      className={classNames}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...rest}
    />
  );
}

