import Footer from '../components/footer'
import Meta from '../components/meta'

export default function Layout({ preview, children }) {
  return (
    <>
      <Meta />
      <div className="min-h-screen bg-gray-50 text-black dark:bg-black dark:text-gray-50">
        <main>{children}</main>
      </div>
      <Footer />
    </>
  )
}
