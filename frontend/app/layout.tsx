import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./reduxToolkit/provider";




export const metadata: Metadata = {
  title: "Book Recommendation System",
  description: "Discover and rent your favorite books",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#D7B19D]">
        <Providers>
          <main className="  ">

            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
