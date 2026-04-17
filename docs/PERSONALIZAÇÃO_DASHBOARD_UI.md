# 📄 RFC — Personalização de Dashboard (UI)

## 🧠 Contexto

O sistema possui um dashboard em Next.js com múltiplos componentes (cards, tabelas, métricas). Surge a necessidade de permitir que cada usuário personalize a forma como esses elementos são exibidos.

Essa personalização inclui:

* Ordem de exibição de cards
* Visibilidade de componentes
* Configuração de colunas em tabelas

---

# 🎯 Objetivo

Permitir que o usuário configure sua experiência visual no dashboard com persistência entre sessões e dispositivos, mantendo consistência e escalabilidade.

---

# 🧱 Decisão Arquitetural

## ✅ Decisão principal

**Persistir preferências no backend com cache no frontend (localStorage)**

---

## 📌 Justificativa

A personalização do dashboard é considerada:

* dado do usuário
* parte da experiência do produto
* relevante entre sessões e dispositivos

Portanto:

> O backend deve ser a fonte de verdade

---

# 🏗️ Modelagem da solução

## Estrutura de dados

```json
{
  "version": 1,
  "dashboard_layout": {
    "cards_order": ["finance", "tasks", "metrics"],
    "hidden_cards": ["alerts"],
    "table_columns": {
      "projects": ["name", "status", "owner"]
    }
  }
}
```

---

## Persistência (Django)

```python
class UserPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    preferences = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)
```

---

## API

### GET

```
GET /api/me/preferences
```

### PATCH (principal)

```
PATCH /api/me/preferences
```

---

# 🔁 Fluxo da aplicação

## 1. Carregamento inicial

* Frontend tenta recuperar layout do localStorage
* Em paralelo, busca no backend

---

## 2. Renderização

* Usa cache local imediatamente
* Atualiza com dados do backend

---

## 3. Interação do usuário

* Drag-and-drop
* Hide/show
* Alteração de colunas

---

## 4. Persistência

* Atualiza estado local
* Atualiza localStorage
* Envia PATCH para backend com debounce

---

# ⚡ Estratégia de cache (frontend)

Uso de localStorage para:

* evitar delay de renderização
* melhorar UX

⚠️ Não é fonte de verdade

---

# 🔢 Versionamento

## Problema

Mudanças futuras no layout podem quebrar configurações antigas.

## Solução

Campo de versão:

```json
{
  "version": 2
}
```

### Estratégia

* Backend detecta versão antiga
* Aplica migração automática
* Retorna estrutura atualizada

---

# ❌ Alternativas consideradas (descartadas)

## 1. Persistência apenas no frontend

### Abordagem

* Uso exclusivo de localStorage

### Motivo do descarte

* Não sincroniza entre dispositivos
* Perda de dados ao limpar cache
* Não confiável para dados do usuário

---

## 2. Regras de layout fixas no frontend

### Abordagem

* UI sem personalização

### Motivo do descarte

* Baixa flexibilidade
* Experiência inferior
* Não atende requisito de personalização

---

# ⚠️ Riscos e mitigação

## 1. Escritas excessivas no backend

### Risco

Múltiplas alterações rápidas gerando alta carga

### Mitigação

* Debounce no frontend (ex: 500ms–1000ms)
* Uso de PATCH parcial

---

## 2. Divergência entre cache e backend

### Risco

UI inconsistente

### Mitigação

* Sempre sincronizar após load
* Backend como fonte final

---

## 3. Mudanças de estrutura

### Risco

Quebra de layouts antigos

### Mitigação

* Versionamento obrigatório
* Camada de migração

---

# 🚀 Evoluções futuras (não escopo atual)

* Perfis de layout (ex: "analista", "gestor")
* Compartilhamento de layouts
* Templates organizacionais

---

# 🧭 Conclusão

## Decisão consolidada

✔ Backend → persistência oficial
✔ localStorage → cache de performance

---

## Resultado esperado

* UX fluida
* Persistência consistente
* Suporte a múltiplos dispositivos
* Base sólida para evolução futura

---

> Alternativas mais simples foram avaliadas e descartadas por não atenderem requisitos de persistência, consistência e escalabilidade.
