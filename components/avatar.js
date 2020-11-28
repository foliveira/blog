import Image from 'next/image'

export default function Avatar({ name }) {
  return (
    <div className="flex items-center">
      <Image src="/avatar/fabio.png" width="48" height="48" className="w-12 h-12 rounded-full avatar" alt={name} />
      <div className="text-xl font-bold ml-4">Fábio Oliveira</div>
    </div>
  )
}
