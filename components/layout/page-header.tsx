import type { ReactNode } from "react"

type PageHeaderProps = {
  title: string
  description?: string
  action?: ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 pb-2 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold leading-tight">{title}</h1>
        {description ? (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  )
}
