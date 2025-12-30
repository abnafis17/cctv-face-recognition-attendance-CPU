"use client";

export function ToggleSwitch(props: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
  title?: string;
}) {
  const { checked, disabled, onChange, ariaLabel, title } = props;

  return (
    <button
      className={`h-6 w-11 rounded-full border transition ${
        checked ? "bg-black" : "bg-white"
      } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
      type="button"
    >
      <div
        className={`h-5 w-5 translate-x-1 rounded-full bg-white shadow transition ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}
