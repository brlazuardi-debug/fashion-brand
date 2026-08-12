import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppBubble from "@/components/WhatsAppBubble";

export const metadata: Metadata = {
  title: "DASILVA BATIK — Artisanal Heritage, Modern Curation",
  description:
    "A modern curation of artisanal Indonesian Batik, blending centuries of tradition with contemporary minimalism. International luxury e-commerce.",
  keywords: [
    "Batik",
    "Indonesian fashion",
    "luxury",
    "Dasilva Batik",
    "handmade",
    "heritage",
  ],
  authors: [{ name: "Dasilva Batik" }],
  openGraph: {
    title: "DASILVA BATIK — Artisanal Heritage, Modern Curation",
    description:
      "A modern curation of artisanal Indonesian Batik, blending centuries of tradition with contemporary minimalism.",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0D0D0D",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Hanken+Grotesk:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-paper text-obsidian font-body-md antialiased min-h-screen flex flex-col">
        <StoreProvider>
          <Header />
          <main className="flex-grow flex flex-col">{children}</main>
          <Footer />
          <CartDrawer />
          <WhatsAppBubble />
        </StoreProvider>
      </body>
    </html>
  );
}
