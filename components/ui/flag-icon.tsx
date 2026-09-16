import * as React from 'react'
import type { Locale } from '@/lib/i18n/types'
import { cn } from '@/lib/utils'

interface FlagIconProps extends React.SVGProps<SVGSVGElement> {
  locale: Locale | string
  className?: string
}

export function FlagIcon({ locale, className, ...props }: FlagIconProps) {
  if (locale === 'th') {
    // Official Flag of Thailand (5 stripes: Red, White, Blue, White, Red)
    return (
      <svg
        viewBox="0 0 640 480"
        className={cn('inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden', className)}
        aria-label="Thailand Flag"
        {...props}
      >
        <rect width="640" height="480" fill="#f4f5f8" />
        <rect width="640" height="80" fill="#a51931" />
        <rect y="400" width="640" height="80" fill="#a51931" />
        <rect y="160" width="640" height="160" fill="#2d2a4a" />
      </svg>
    )
  }

  if (locale === 'en') {
    // Official Union Jack (United Kingdom) Flag
    return (
      <svg
        viewBox="0 0 640 480"
        className={cn('inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden', className)}
        aria-label="United Kingdom Flag"
        {...props}
      >
        <path fill="#012169" d="M0 0h640v480H0z" />
        <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-179L0 64V0h75z" />
        <path fill="#C8102E" d="m424 281 216 159v40L369 281h55zm-104-40 240-181h80v20L400 261l-80-20zM0 440l190-140h55L0 480v-40zm0-440 240 180H185L0 40V0z" />
        <path fill="#FFF" d="M240 0h160v480H240zM0 160h640v160H0z" />
        <path fill="#C8102E" d="M267 0h107v480H267zM0 187h640v107H0z" />
      </svg>
    )
  }

  // Official Flag of Myanmar (Yellow, Green, Red with White 5-point star)
  return (
    <svg
      viewBox="0 0 640 480"
      className={cn('inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden', className)}
      aria-label="Myanmar Flag"
      {...props}
    >
      <rect width="640" height="160" fill="#fecb00" />
      <rect y="160" width="640" height="160" fill="#34b233" />
      <rect y="320" width="640" height="160" fill="#ea2839" />
      <polygon fill="#ffffff" points="320,84 357,198 477,198 380,268 417,382 320,312 223,382 260,268 163,198 283,198" />
    </svg>
  )
}
