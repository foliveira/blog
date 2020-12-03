import { FaCreativeCommons, FaCreativeCommonsBy } from 'react-icons/fa';

export default function Copyright() {
  return (
    <a className="flex flex-row justify-center items-center" 
        href="https://creativecommons.org/licenses/by/4.0/" 
        target="_blank" 
        rel="noopener">
      <div className="mx-1 font-bold py-3 px-1 mb-6 lg:mb-0">
        <FaCreativeCommons size="24px"/>
      </div>
      <div className="mx-1 font-bold py-3 px-1 mb-6 lg:mb-0">
        <FaCreativeCommonsBy size="24px"/> 
      </div>
      <div className="mx-1 font-bold py-3 px-1 mb-6 lg:mb-0">Fábio Oliveira</div>
    </a>
  )
}
