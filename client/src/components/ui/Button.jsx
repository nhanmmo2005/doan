import React from "react";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}) {
  const classes = ["btn", `btn-${variant}`, `btn--${size}`, className].filter(Boolean).join(" ");
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}

