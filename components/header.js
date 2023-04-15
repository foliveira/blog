import Link from 'next/link'
import { BLOG_TITLE } from '../lib/constants'

export default function Header() {
  return (
    <h2 className="text-2xl md:text-4xl font-bold tracking-tight md:tracking-tighter leading-tight mb-20">
      <Link href="/" className="hover:underline">
        { BLOG_TITLE }
      </Link>
      .
    </h2>
  );
}
