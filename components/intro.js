import { TAGLINE, BLOG_TITLE } from '../lib/constants'

export default function Intro() {
  return (
    <header className="flex flex-col md:flex-row items-end mb-8 md:mb-12">
      <h1 className="text-6xl md:text-8xl font-bold tracking-tighter md:pr-8">
        { BLOG_TITLE }.
      </h1>
      <h2 className="pb-1 text-m md:text-2xl font-bold tracking-tighter">
        { TAGLINE }&hellip;
      </h2>
    </header>
  )
}
