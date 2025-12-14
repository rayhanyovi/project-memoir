"use client";

import type { ReactNode } from "react";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <div className="text-sm font-semibold text-muted-foreground">
            Memoir dashboard
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Input
              placeholder="Search"
              className="h-9 w-40 bg-background sm:w-56 md:w-64"
            />
            <Button size="sm" className="shadow-sm">
              New entry
            </Button>
          </div>
        </header>

        <div className="flex-1">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-10 pt-6 md:px-6 lg:px-10">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
