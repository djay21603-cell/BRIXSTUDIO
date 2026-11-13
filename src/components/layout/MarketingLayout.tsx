import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'

export function MarketingLayout() {
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const target = document.querySelector(location.hash)
      if (target) {
        window.requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }))
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname, location.hash])

  return (
    <div id="top" className="page-canvas flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
