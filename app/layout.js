import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "./components/Toast";
import ClientLayout from "./components/ClientLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SkillSwap - Exchange Skills, Grow Together",
  description: "Join the world's first decentralized skill-sharing platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-100`}>
        <ToastProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </ToastProvider>
      </body>
    </html>
  );
}