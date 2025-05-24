# Correção: Filtragem de Dados por Fonte em Widgets ✅

## 🎯 **Problema Identificado**

O usuário reportou que ao selecionar **apenas métricas do Meta Ads** (`meta_spend`), o widget estava exibindo dados **tanto do Meta Ads quanto do Google Analytics**.

### **Evidência do Problema nos Logs**
```
🔍 [CustomWidget] Widget.metrics: ['meta_spend']        // ✅ Apenas Meta Ads
🔍 [CustomWidget] Processando contas Meta Ads...        // ✅ Correto  
🔍 [CustomWidget] Processando contas Google Analytics... // ❌ ERRO: não deveria processar GA
```

**Causa Raiz**: O código processava **sempre** todas as fontes de dados disponíveis, independentemente das métricas selecionadas.

## 🔧 **Correção Implementada**

### **1. Análise de Métricas por Fonte**

Antes de processar os dados, o sistema agora verifica quais fontes são necessárias:

```javascript
// 🔧 CORREÇÃO: Verificar se há métricas do Meta Ads antes de processar
const hasMetaMetrics = widget.metrics.some(metric => {
  const metricId = getMetricId(metric);
  return metricId.startsWith('meta_');
});

// 🔧 CORREÇÃO: Verificar se há métricas do Google Analytics antes de processar
const hasGAMetrics = widget.metrics.some(metric => {
  const metricId = getMetricId(metric);
  return metricId.startsWith('ga_');
});

console.log('🔍 [CustomWidget] hasMetaMetrics:', hasMetaMetrics);
console.log('🔍 [CustomWidget] hasGAMetrics:', hasGAMetrics);
```

### **2. Processamento Condicional - Gráficos**

```javascript
// Processar contas Meta Ads apenas se houver métricas Meta
if (hasMetaMetrics && data.metaAds?.accounts && data.metaAds.accounts.length > 0) {
  console.log('🔍 [CustomWidget] Processando contas Meta Ads...');
  data.metaAds.accounts.forEach(account => {
    // ... processar apenas métricas que começam com 'meta_'
    if (metricId.startsWith('meta_')) {
      switch (metricId) {
        case 'meta_spend':
          item.spend = account.spend || 0;
          break;
        // ... outras métricas Meta
      }
    }
  });
}

// Processar contas Google Analytics apenas se houver métricas GA
if (hasGAMetrics && data.googleAnalytics?.accounts && data.googleAnalytics.accounts.length > 0) {
  console.log('🔍 [CustomWidget] Processando contas Google Analytics...');
  // ... só executa se realmente há métricas GA selecionadas
}
```

### **3. Processamento Condicional - Tabelas**

```javascript
// Adicionar dados de Meta Ads apenas se houver métricas Meta
if (hasMetaMetrics && data.metaAds?.accounts && data.metaAds.accounts.length > 0) {
  console.log('🔍 [CustomWidget] [TABLE] Processando contas Meta Ads...');
  // ... adicionar linhas Meta Ads
}

// Adicionar dados de Google Analytics apenas se houver métricas GA
if (hasGAMetrics && data.googleAnalytics?.accounts && data.googleAnalytics.accounts.length > 0) {
  console.log('🔍 [CustomWidget] [TABLE] Processando contas Google Analytics...');
  // ... adicionar linhas GA
}
```

### **4. Fallback Inteligente para Totais**

```javascript
// Adicionar totais apenas se as métricas correspondentes estão selecionadas
if (hasMetaMetrics) {
  row.gasto = data.metaAds?.totalSpend || 0;
  row.impressoes = data.metaAds?.totalImpressions || 0;
  // ... outros totais Meta
}

if (hasGAMetrics) {
  row.sessoes = data.googleAnalytics?.totalSessions || 0;
  row.usuarios = data.googleAnalytics?.totalUsers || 0;
  // ... outros totais GA
}
```

## 📊 **Comportamento Corrigido**

### **Cenário 1: Apenas Meta Ads (`['meta_spend']`)**
```
✅ hasMetaMetrics: true
❌ hasGAMetrics: false
🔍 Processando contas Meta Ads...
⏭️ Pulando Google Analytics (sem métricas GA)
```

**Resultado**: Widget mostra apenas dados do Meta Ads

### **Cenário 2: Apenas Google Analytics (`['ga_sessions']`)**
```
❌ hasMetaMetrics: false
✅ hasGAMetrics: true
⏭️ Pulando Meta Ads (sem métricas Meta)
🔍 Processando contas Google Analytics...
```

**Resultado**: Widget mostra apenas dados do Google Analytics

### **Cenário 3: Métricas Mistas (`['meta_spend', 'ga_sessions']`)**
```
✅ hasMetaMetrics: true
✅ hasGAMetrics: true
🔍 Processando contas Meta Ads...
🔍 Processando contas Google Analytics...
```

**Resultado**: Widget mostra dados de ambas as fontes

## 🎉 **Logs Esperados Após Correção**

Para widget com `meta_spend` apenas:
```
🔍 [CustomWidget] Widget.metrics: ['meta_spend']
🔍 [CustomWidget] hasMetaMetrics: true
🔍 [CustomWidget] hasGAMetrics: false
🔍 [CustomWidget] Processando contas Meta Ads...
🔍 [CustomWidget] Processando métrica meta_spend para conta test
✅ [CustomWidget] Google Analytics pulado (sem métricas GA selecionadas)
```

## ✅ **Benefícios da Correção**

1. **Precisão**: Widgets mostram apenas dados relevantes às métricas selecionadas
2. **Performance**: Evita processamento desnecessário de dados irrelevantes  
3. **UX Melhorada**: Usuário vê exatamente o que configurou
4. **Logs Limpos**: Debug mais claro sobre qual fonte está sendo processada
5. **Flexibilidade**: Suporta widgets mistos (Meta + GA) ou únicos (só Meta ou só GA)

---

**Status**: ✅ **CORREÇÃO IMPLEMENTADA**  
**Timestamp**: 25/01/2025 22:30  
**Aplicado em**: `prepareChartData()` e `renderTable()`  
**Teste**: Widget com `meta_spend` deve mostrar apenas dados Meta Ads 