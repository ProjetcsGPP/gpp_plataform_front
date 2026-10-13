"use client";

import type { FormEventHandler, ReactNode } from "react";
import Link from "next/link";
import { Loader2, Save } from "lucide-react";

import { AdminAlert, AdminPanel } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";

interface AdminFormPanelProps {
  onSubmit: FormEventHandler<HTMLFormElement>;
  isSubmitting: boolean;
  error?: string | null;
  cancelHref: string;
  children: ReactNode;
}

export function AdminFormPanel({
  onSubmit,
  isSubmitting,
  error,
  cancelHref,
  children,
}: AdminFormPanelProps) {
  return (
    <AdminPanel className="max-w-3xl">
      <form onSubmit={onSubmit} noValidate>
        <div className="space-y-5 p-6">
          {error && <AdminAlert>{error}</AdminAlert>}
          {children}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button variant="outline" asChild>
            <Link href={cancelHref}>Cancelar</Link>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-app-primary text-app-primary-text hover:bg-app-primary-hover"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Save aria-hidden="true" />
            )}
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </footer>
      </form>
    </AdminPanel>
  );
}
