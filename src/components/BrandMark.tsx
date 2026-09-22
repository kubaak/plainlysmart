export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`brand-mark ${className}`}
      width="29"
      height="30"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path d="M4 4h13c15 0 15 20 0 20h-5v8H4V4Zm8 7v6h5c5 0 5-6 0-6h-5Z" fill="currentColor" />
      <path d="M4 4h8v8H4z" fill="currentColor" />
    </svg>
  );
}
