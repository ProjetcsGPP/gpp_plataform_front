// src/app/portal/usuarios/page.tsx
"use client";

import { RouteGuard } from "@/components/common/RouteGuard";
import { Can } from "@/components/common/Can";
import { PermissionGate } from "@/components/common/PermissionGate";

export default function UsuariosPage() {
  return (
    // Guard de rota: precisa de usuarios.view para acessar a tela
    <RouteGuard permission="usuarios.view">
      <div>
        <h1>Usuários</h1>

        {/* Botão só aparece se pode criar */}
        <Can permission="user.add">
          <button>Novo Usuário</button>
        </Can>

        <TabelaUsuarios />
      </div>
    </RouteGuard>
  );
}

function TabelaUsuarios() {
  return (
    <table>
      {/* Coluna de ações: visível só se pode editar OU deletar */}
      <PermissionGate permissions={["user.change", "user.delete"]} mode="any">
        <th>Ações</th>
      </PermissionGate>

      {/* Ações individuais por linha */}
      <Can permission="user.change">
        <button>Editar</button>
      </Can>

      <Can permission="user.delete">
        <button>Excluir</button>
      </Can>
    </table>
  );
}
