import { Mail, ExternalLink } from 'lucide-react';
import styles from './contact.module.css';

// GitHub and LinkedIn brand marks are inlined rather than pulled from lucide —
// this project's lucide-react build doesn't export the brand icons, and a missing
// named import renders `undefined` as a component and throws. Inline SVG has no
// such dependency and always renders. Mail is a plain lucide glyph, which is fine.
const GithubMark = (props) => (
  <svg viewBox='0 0 24 24' width='18' height='18' fill='currentColor' aria-hidden='true' {...props}>
    <path d='M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.4-1.27.73-1.56-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.28 5.69.41.36.78 1.06.78 2.14v3.18c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z' />
  </svg>
);

const LinkedinMark = (props) => (
  <svg viewBox='0 0 24 24' width='18' height='18' fill='currentColor' aria-hidden='true' {...props}>
    <path d='M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.8 0 0 .78 0 1.75v20.5C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.75V1.75C24 .78 23.2 0 22.22 0Z' />
  </svg>
);

// Real, clickable contact details. External links open in a new tab with
// rel=noreferrer so the target can't see the referrer or reach window.opener.
const LINKS = [
  { label: 'Email', value: 't.uday.kanth12@gmail.com', href: 'mailto:t.uday.kanth12@gmail.com', icon: Mail },
  { label: 'GitHub', value: 'github.com/udaykt', href: 'https://github.com/udaykt', icon: GithubMark },
  { label: 'LinkedIn', value: 'linkedin.com/in/udaykt', href: 'https://linkedin.com/in/udaykt', icon: LinkedinMark },
];

const Contact = () => (
  <div className={styles.contact}>
    <div className={styles.card}>
      <div className={styles.avatar}>U</div>
      <h1 className={styles.name}>Uday Kanth</h1>
      <p className={styles.tagline}>
        Full-stack engineer. I built PizzaMaker — say hi, or poke at the source.
      </p>

      <div className={styles.links}>
        {LINKS.map(({ label, value, href, icon: Icon }) => (
          <a
            key={label}
            className={styles.link}
            href={href}
            target={href.startsWith('mailto:') ? undefined : '_blank'}
            rel='noreferrer'
          >
            <span className={styles.linkIcon}><Icon size={18} /></span>
            <span className={styles.linkText}>
              <span className={styles.linkLabel}>{label}</span>
              <span className={styles.linkValue}>{value}</span>
            </span>
          </a>
        ))}
      </div>

      <a
        className={styles.repo}
        href='https://github.com/udaykt/PizzaMaker'
        target='_blank'
        rel='noreferrer'
      >
        View the PizzaMaker source
        <ExternalLink size={14} />
      </a>
    </div>
  </div>
);

export default Contact;
