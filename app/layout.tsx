import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "NutriCare EHR | Tele-nutrition Platform",
  description: "Tele-nutrition and digital health platform for nutrition care teams.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className="min-h-screen bg-slate-100 font-sans text-slate-800 antialiased selection:bg-teal-500 selection:text-white">
        {children}
        <Script
          src="https://meet.jit.si/external_api.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
