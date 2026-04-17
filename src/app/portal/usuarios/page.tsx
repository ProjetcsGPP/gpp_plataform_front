// src/app/portal/usuarios/page.tsx
// P4: RouteGuard removido daqui — centralizado em usuarios/layout.tsx
// P5: strings de permissão corrigidas para constantes do registry central
"use client";

import { Can }            from "@/components/common/Can";
import { PermissionGate } from "@/components/common/PermissionGate";
import { PERMISSIONS }    from "@/lib/permissions";

export default function UsuariosPage() {
  return (
    <div>
      <h1>Usuários</h1>

      {/* Botão só aparece se pode criar */}
      <Can permission={PERMISSIONS.USER_ADD}>
        <button>Novo Usuário</button>
      </Can>

      <TabelaUsuarios />
    </div>
  );
}

function TabelaUsuarios() {
  return (
    <table>
      {/* Coluna de ações: visível só se pode editar OU deletar */}
      <PermissionGate
        permissions={[PERMISSIONS.USER_CHANGE, PERMISSIONS.USER_DELETE]}
        mode="any"
      >
        <th>Ações</th>
      </PermissionGate>

      {/* Ações individuais por linha */}
      <Can permission={PERMISSIONS.USER_CHANGE}>
        <button>Editar</button>
      </Can>

      <Can permission={PERMISSIONS.USER_DELETE}>
        <button>Excluir</button>
      </Can>
    </table>
  );
}
