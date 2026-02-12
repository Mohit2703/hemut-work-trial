import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Freight Marketplace",
  description: "Freight Marketplace MVP",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav style={{ padding: "0.5rem 1rem", borderBottom: "1px solid #eee", marginBottom: 0 }}>
          <a href="/marketplace" style={{ marginRight: "1rem" }}>Freight Marketplace</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
