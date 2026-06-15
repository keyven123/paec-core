import { Mail, MapPin, Phone } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  cmsService,
  DEFAULT_FOOTER_SETTINGS,
  type CmsFooterLink,
  type CmsFooterSettings,
} from '@/services/cmsService'

function FooterLinkItem({ link }: { link: CmsFooterLink }) {
  const isExternal = link.href.startsWith('http') || link.href.startsWith('mailto:')

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
  const [settings, setSettings] = useState<CmsFooterSettings>(DEFAULT_FOOTER_SETTINGS)

  useEffect(() => {
    let cancelled = false

    async function loadFooter() {
      try {
        const data = await cmsService.getPublicFooter()
        if (!cancelled) {
          setSettings(data)
        }
      } catch {
        if (!cancelled) {
          setSettings(DEFAULT_FOOTER_SETTINGS)
        }
      }
    }

    void loadFooter()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <footer className="bg-[#0b1120] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
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
            <h3 className="mb-4 text-sm font-semibold">Location</h3>
            <ul className="space-y-2.5">
              {settings.explore_links.map((link) => (
                <li key={`${link.label}-${link.href}`}>
                  <FooterLinkItem link={link} />
                </li>
              ))}
            </ul>
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

          <div>
            <h3 className="mb-4 text-sm font-semibold">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5 text-sm text-slate-400">
                <Mail className="size-4 shrink-0 text-paec-violet" />
                {settings.contact_email}
              </li>
              <li className="flex items-center gap-2.5 text-sm text-slate-400">
                <Phone className="size-4 shrink-0 text-paec-violet" />
                {settings.contact_phone}
              </li>
              <li className="flex items-center gap-2.5 text-sm text-slate-400">
                <MapPin className="size-4 shrink-0 text-paec-violet" />
                {settings.contact_address}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-6 text-sm text-white sm:flex-row">
          <p>{settings.copyright}</p>
          <p className="flex items-center gap-2">
            <span className="text-white">Powered by</span>
            <img
              src="/tktoc-logobg.png"
              alt="Ticketoc"
              className="h-7 w-auto"
            />
          </p>
        </div>
      </div>
    </footer>
  )
}
