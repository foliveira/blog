import Container from './container'
import Social from './social'
import { SOCIAL_MEDIA } from '../lib/constants'
import { FaGithub, FaTwitter, FaLinkedin, FaGitlab, FaUserNinja } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="border-t bg-gray-200 border-gray-300 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-50">
      <Container>
        <div className="py-12 flex flex-col lg:flex-row items-center">
          <div className="flex flex-row justify-center items-center">

          <Social url={SOCIAL_MEDIA.twitter}>
              <FaTwitter />
            </Social>
            <Social url={SOCIAL_MEDIA.github}>
              <FaGithub />
            </Social>
            <Social url={SOCIAL_MEDIA.gitlab}>
              <FaGitlab />
            </Social>
            <Social url={SOCIAL_MEDIA.linkedin}>
              <FaLinkedin />
            </Social>
            <Social url={SOCIAL_MEDIA.website}>
              <FaUserNinja />
            </Social>

          </div>
          <div className="text-m font-bold ml-4">{new Date().getFullYear()} &copy; Fábio Oliveira</div>
        </div>
      </Container>
    </footer>
  )
}
