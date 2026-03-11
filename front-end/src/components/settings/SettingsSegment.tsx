import { ReactNode } from "react"

import { cn } from "@/lib/utils"

type SettingsSegmentProps = {
  title: string
  description?: string
  className?: string
  children: ReactNode
}

export default function SettingsSegment({
  title,
  description,
  className,
  children,
}: SettingsSegmentProps) {
  return (
    <section className={cn("rounded-xl border bg-white p-4 shadow-sm", className)}>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-zinc-600">{description}</p>
        ) : null}
      </div>

      {children}
    </section>
  )
}
