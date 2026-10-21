"use client";

import { MoveRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ItemOrganograma, ItemOrganogramaImpacto } from "@/features/carga-org-lot/model";

export function MoveItemOrganogramaDialog({ item, impacto, isMoving, onConfirm, onCancel }: { item: ItemOrganograma; impacto: ItemOrganogramaImpacto; isMoving: boolean; onConfirm: () => void; onCancel: () => void }) {
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="move-item-title"><section className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl"><div className="p-6"><div className="flex items-start gap-3"><div className="rounded-full bg-amber-100 p-2 text-amber-800"><MoveRight aria-hidden="true" /></div><div><h2 id="move-item-title" className="text-lg font-bold text-slate-900">Movimentar estrutura?</h2><p className="mt-2 text-sm text-slate-700">A unidade <strong>“{item.strsigla}”</strong> possui <strong>{impacto.total_descendentes}</strong> unidades subordinadas. Ao alterar sua unidade superior, toda essa estrutura será movimentada.</p></div></div></div><footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4"><Button variant="outline" onClick={onCancel} disabled={isMoving}>Cancelar</Button><Button onClick={onConfirm} disabled={isMoving}>{isMoving ? "Movimentando..." : "Continuar movimentação"}</Button></footer></section></div>;
}
