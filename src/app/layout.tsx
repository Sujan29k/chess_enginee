// app/layout.tsx (this is a Server Component!)
import "./globals.css";
import AuthProvider from "./providers/SessionProvider";

export const metadata = {
  title: "Chess App",
  description: "Multiplayer chess game",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* ✅ This is OK - Client component used inside server layout */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
