export function PdfFileIcon() {
  return (
    <svg
      data-slot="pdf-file-icon"
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 40 48"
      fill="none"
    >
      <path
        d="M8 2h16l10 10v32a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"
        fill="var(--background)"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M24 2v10h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 19h16M12 24h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="1" y="29" width="38" height="15" rx="3" fill="currentColor" />
      <path
        d="M8 40v-7h3a2 2 0 0 1 0 4H8m9-4v7h2a3.5 3.5 0 0 0 0-7h-2Zm10 7v-7h5m-5 3.5h4"
        stroke="var(--background)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
