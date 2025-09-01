import type { Metadata } from 'next'
import { AuthProvider } from '@/contexts/AuthContext'
import Image from 'next/image'
import './globals.css'

export const metadata: Metadata = {
  title: 'FC&F Daily Tracker',
  description: 'Track daily task counts and calculate productivity metrics for ops teams',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center py-4">
                <div className="flex flex-col items-start">
            <Image
              src="/Black Constantinople Logo.png"
              alt="Constantinople Logo"
              width={320}
              height={160}
              priority
            />
                  <h1 className="text-lg font-medium text-gray-900">FC&F Daily Tracker</h1>
                </div>
              </div>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
