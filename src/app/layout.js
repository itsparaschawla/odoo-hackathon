import './globals.css'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import NotificationBell from '@/components/NotificationBell'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'StackIt - Q&A Forum',
  description: 'A minimal question-and-answer platform for collaborative learning',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {/* Navigation Bar */}
          <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">StackIt</span>
                </Link>

                {/* Navigation Links */}
                <div className="flex items-center space-x-4">
                  <Link 
                    href="/ask" 
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Ask Question
                  </Link>
                  
                  <Link 
                    href="/dashboard" 
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>

                  <NotificationBell />

                  {/* User Menu - Replace with actual auth logic */}
                  <div className="flex items-center space-x-2">
                    <button className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                      Login
                    </button>
                    {/* <button className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                      Register
                    </button> */}
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}