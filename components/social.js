export default function Avatar({ url, children }) {
  return (
    <a href={url} className="mx-3 font-bold py-3 px-4 mb-6 lg:mb-0">
      { children }
    </a>
  )
}
