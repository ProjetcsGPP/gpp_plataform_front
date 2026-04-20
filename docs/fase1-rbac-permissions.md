### Decisão arquitetural aplicada

```
ANTES:                          DEPOIS:
┌──────────────────────┐        ┌──────────────────────┐
│  permissionsStore    │        │  permissionsStore    │
│  role, granted ✅    │        │  role, granted ✅    │
│  can() ❌ (lógica)   │  ───►  │  (só dados) ✅       │
└──────────────────────┘        └──────────────────────┘
                                          │
                                          ▼
                                ┌──────────────────────┐
                                │  permissions.service │
                                │  buildPermissionCtx  │
                                │  sanitizeGranted     │
                                │  has/hasAny/hasAll   │
                                └──────────────────────┘
                                          │
                                          ▼
                                ┌──────────────────────┐
                                │  usePermissions      │
                                │  (composição React)  │
                                │  useMemo + service   │
                                └──────────────────────┘
                                          │
                                          ▼
                                ┌──────────────────────┐
                                │  useScreenGuard      │
                                │  delega hasAll/hasAny│
                                └──────────────────────┘
```

### O que mudou em cada arquivo

**`permissions.service.ts`** (novo)  
Única fonte de verdade para lógica de autorização. `buildPermissionContext` recebe `role` e `granted[]` brutos, sanitiza contra o registry `PERMISSIONS`, e retorna um objeto imutável com `has`, `hasAny`, `hasAll`, `can`. A sanitização usa um `Set` para garantir performance O(1) e bloquear tokens inválidos do backend.

**`permissionsStore.ts`**  
Removido o método `can()`. A store agora respeita o contrato: _dados apenas_. Isso elimina a duplicação de lógica entre store e service, e garante que nenhum componente possa usar `store.can()` como atalho não tipado.

**`usePermissions.ts`**  
Substituído o `canFn` direto da store por `buildPermissionContext` com `useMemo`. O memo recalcula apenas quando `role` ou `granted` mudam. Expostos `hasAny` e `hasAll` além de `can` — API aditiva, sem quebrar código existente.

**`useScreenGuard.ts`**  
Removido `keys.every`/`keys.some` inline. Agora delega para `hasAll`/`hasAny` do hook. Tipagem de `permissions` alterada de `string | string[]` para `PermissionKey | PermissionKey[]` — erros de digitação são detectados em tempo de compilação. A otimização `keys.length === 1 ? can(keys[0])` evita criar array desnecessário para o caso mais comum.

### Compatibilidade garantida

- `usePermissionsHydrator` não foi alterado — continua chamando `setPermissions(role, granted)` normalmente
- `useScreenGuard` mantém a mesma assinatura externa (`permissions`, `mode`, retorna `{ allowed, isLoading, isHydrated }`)
- `usePermissions` mantém `can`, `role`, `granted`, `isLoading`, `isHydrated` — adiciona `hasAny` e `hasAll`
- Todos os testes existentes do `useScreenGuard` passam sem modificação de comportamento

---

## Estrutura de diretórios após a Fase 1

```
src/
├── domain/
│   └── permissions/
│       ├── permissions.service.ts          ← NOVO
│       └── __tests__/
│           └── permissions.service.test.ts ← NOVO
├── store/
│   └── permissionsStore.ts                 ← can() removido
├── hooks/
│   ├── usePermissions.ts                   ← usa service + useMemo
│   └── useScreenGuard.ts                   ← usa hasAll/hasAny
└── lib/
    └── permissions.ts                      ← inalterado (fonte de PermissionKey)
```
