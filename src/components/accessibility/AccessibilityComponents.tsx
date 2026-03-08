import React from "react";

/**
 * SkipLink component for keyboard navigation
 * Allows users to skip to main content
 */
export const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="skip-link"
      style={{
        position: "absolute",
        left: "-9999px",
        zIndex: 999,
        padding: "1rem",
        backgroundColor: "var(--primary)",
        color: "white",
        textDecoration: "none",
        borderRadius: "0 0 4px 0",
      }}
      onFocus={(e) => {
        e.currentTarget.style.left = "0";
      }}
      onBlur={(e) => {
        e.currentTarget.style.left = "-9999px";
      }}
    >
      Skip to main content
    </a>
  );
};

/**
 * VisuallyHidden component for screen reader only content
 */
export const VisuallyHidden: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <span
      className="sr-only"
      style={{
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: 0,
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0,
      }}
    >
      {children}
    </span>
  );
};

/**
 * LiveRegion component for announcing dynamic content
 */
interface LiveRegionProps {
  message: string;
  politeness?: "polite" | "assertive";
  atomic?: boolean;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  politeness = "polite",
  atomic = true,
}) => {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {message}
    </div>
  );
};

/**
 * FocusIndicator component for custom focus styles
 */
export const FocusIndicator: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div
      style={{
        outline: "2px solid transparent",
        outlineOffset: "2px",
      }}
      onFocus={(e) => {
        e.currentTarget.style.outline = "2px solid var(--primary)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = "2px solid transparent";
      }}
    >
      {children}
    </div>
  );
};
