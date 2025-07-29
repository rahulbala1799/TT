'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const Navigation = () => {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/orders', label: 'Orders', icon: '📋' },
    { href: '/customers', label: 'Customers', icon: '👥' },
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  ]

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-soft border-b border-gray-200 sticky top-0 z-40">
      <div className="container-responsive">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg lg:text-xl group-hover:scale-105 transition-transform duration-200">
              P
            </div>
            <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              PrintTrack
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${
                  pathname === item.href ? 'nav-item-active' : ''
                }`}
              >
                <span className="text-lg mr-2">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {pathname === item.href && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>
                )}
              </Link>
            ))}
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="btn btn-ghost p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          
          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <Link href="/auth/signin" className="btn btn-secondary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign In
            </Link>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation - Hidden by default, would need state management to show/hide */}
      <div className="md:hidden border-t border-gray-200 bg-white">
        <div className="container-responsive py-4">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center space-x-2 p-3 rounded-xl transition-all duration-200 ${
                  pathname === item.href
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation 