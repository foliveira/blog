import Container from './container'
import Social from './social'
import Copyright from './copyright'
import { SOCIAL_MEDIA } from '../lib/constants'
import { FaGithub, FaTwitter, FaLinkedin, FaGitlab, FaIdCard } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="border-t bg-gray-200 border-gray-300 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-50">
      <Container>
        <div className="py-12 flex flex-col lg:flex-row items-stretch justify-between">
          <div className="flex flex-row justify-center items-center">
            <Social url={SOCIAL_MEDIA.twitter}>
              <FaTwitter size="24px" />
            </Social>
            <Social url={SOCIAL_MEDIA.github}>
              <FaGithub size="24px" />
            </Social>
            <Social url={SOCIAL_MEDIA.gitlab}>
              <FaGitlab size="24px" />
            </Social>
            <Social url={SOCIAL_MEDIA.linkedin}>
              <FaLinkedin size="24px" />
            </Social>
            <Social url={SOCIAL_MEDIA.website}>
              <FaIdCard size="24px" />
            </Social>
          </div>
          
          <Copyright />
        </div>
      </Container>
    </footer>
  )
}
