import "./globals.css";
import { BRAND } from "../lib/brand";

export const metadata = {
  title: `${BRAND.name} ${BRAND.descriptor}`,
  description:
    "Healthcare staffing for facilities, starting with long-term care in New Hampshire.",
  // Test site: ask search engines not to list it. Remove when the site is ready to be public.
  robots: { index: false, follow: false },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Source+Sans+3:wght@400;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
