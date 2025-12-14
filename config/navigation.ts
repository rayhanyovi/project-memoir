import type { ComponentType } from "react"
import {
  BookOpenTextIcon,
  CheckSquareIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  NotebookPenIcon,
  Settings2Icon,
  SquareLibraryIcon,
} from "lucide-react"

type NavigationItem = {
  title: string
  href: string
  icon: ComponentType<{ className?: string }>
  badge?: string
}

type NavigationSection = {
  title: string
  items: NavigationItem[]
}

export const navigation: NavigationSection[] = [
  {
    title: "Workspace",
    items: [
      {
        title: "Overview",
        href: "/",
        icon: LayoutDashboardIcon,
      },
      {
        title: "Journal",
        href: "/journal",
        icon: NotebookPenIcon,
      },
      {
        title: "Library",
        href: "/library",
        icon: SquareLibraryIcon,
      },
      {
        title: "Tasks",
        href: "/tasks",
        icon: CheckSquareIcon,
        badge: "3",
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        title: "Collections",
        href: "/collections",
        icon: BookOpenTextIcon,
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings2Icon,
      },
      {
        title: "Support",
        href: "/support",
        icon: LifeBuoyIcon,
      },
    ],
  },
]
