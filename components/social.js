export default function Social({ url, children }) {
  return (
    <a href={url} target="_blank" rel="noopener" className="mx-3 font-bold py-3 px-4 mb-6 lg:mb-0">
      { children }
    </a>
  )
}
