import { CMS_NAME, BLOG_TITLE } from '../lib/constants'

export default function Intro() {
  return (
    <section className="flex-col md:flex-row flex items-center md:justify-between md:mb-12">
      <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-tight md:pr-8">
        { BLOG_TITLE }.
      </h1>
    </section>
  )
}
