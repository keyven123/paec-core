import { Mail, MapPin, Phone } from 'lucide-react'

import { useSiteContact } from '@/components/layout/useSiteContact'
import {
  getGoogleMapsHref,
  getMailtoHref,
  getPhoneHref,
  openEmailComposer,
} from '@/lib/contactLinks'
import type { CmsFooterLink } from '@/services/cmsService'

function FooterLinkItem({ link }: { link: CmsFooterLink }) {
  const isExternal =
    link.href.startsWith('http') || link.href.startsWith('mailto:')

  if (isExternal || link.href.startsWith('#') || link.href.startsWith('/?')) {
    return (
      <a
        href={link.href}
        className="text-sm text-slate-400 transition-colors hover:text-white"
      >
        {link.label}
      </a>
    )
  }

  return (
    <a
      href={link.href}
      className="text-sm text-slate-400 transition-colors hover:text-white"
    >
      {link.label}
    </a>
  )
}

export function Footer() {
  const settings = useSiteContact()

  return (
    <footer className="bg-[#0b1120] text-white">
      <div className="mx-auto max-w-7xl px-4 pt-10 pb-8 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-10 lg:grid-cols-3">
          <div className="col-span-2 space-y-4 lg:col-span-1">
            <img
              src="/Paec-Logo.png"
              alt="PAEC"
              className="h-12 w-auto brightness-0 invert"
            />
            <p className="max-w-xs text-sm leading-relaxed text-slate-400">
              {settings.company_description}
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Support</h3>
            <ul className="space-y-2.5">
              {settings.support_links.map((link) => (
                <li key={`${link.label}-${link.href}`}>
                  <FooterLinkItem link={link} />
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <h3 className="mb-4 text-sm font-semibold">Contact Us</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href={getMailtoHref(settings.contact_email)}
                  onClick={(event) =>
                    openEmailComposer(event, settings.contact_email)
                  }
                  className="flex items-center gap-2.5 text-sm text-slate-400 transition-colors hover:text-white"
                >
                  <Mail className="size-4 shrink-0 text-paec-violet" />
                  {settings.contact_email}
                </a>
              </li>
              <li>
                <a
                  href={getPhoneHref(settings.contact_phone)}
                  className="flex items-center gap-2.5 text-sm text-slate-400 transition-colors hover:text-white"
                >
                  <Phone className="size-4 shrink-0 text-paec-violet" />
                  {settings.contact_phone}
                </a>
              </li>
              <li>
                <a
                  href={getGoogleMapsHref(settings.contact_address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-slate-400 transition-colors hover:text-white"
                >
                  <MapPin className="size-4 shrink-0 text-paec-violet" />
                  {settings.contact_address}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-6 text-center text-xs text-white sm:mt-12 sm:flex-row sm:text-left sm:text-sm">
          <p>{settings.copyright}</p>
          <p className="flex items-center gap-2">
            <span className="text-white">Powered by</span>
            <a
              href="https://ticketoc.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit Ticketoc"
              className="transition-opacity hover:opacity-80"
            >
              <img
                src="/tktoc-logobg.png"
                alt="Ticketoc"
                className="h-7 w-auto"
              />
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
