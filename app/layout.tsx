import type { Metadata } from "next"
import { Poppins, Pacifico } from "next/font/google"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-poppins",
})

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pacifico",
})

export const metadata: Metadata = {
  title: "Will You Be My Valentine?",
  description: "A sweet Valentine's Day experience made with Mahal.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${pacifico.variable}`}>
        {children}
      </body>
    </html>
  )
}
