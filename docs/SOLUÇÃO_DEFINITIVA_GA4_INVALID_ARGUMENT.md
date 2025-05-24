# Investigação Avançada: GA4 INVALID_ARGUMENT - Propriedade 290353757

## 🚨 **ESTRATÉGIA ALTERADA - PROTEÇÕES REMOVIDAS**

### **⚠️ MUDANÇA DE ABORDAGEM - 24/05/2025**:
- ❌ **Proteções temporárias REMOVIDAS** da propriedade 290353757
- ✅ **Sistema de diagnóstico avançado IMPLEMENTADO**  
- 🔬 **Investigação completa ATIVADA**
- 📊 **Logs detalhados HABILITADOS**

## 🔍 **Sistema de Diagnóstico Implementado**

### **🆕 Nova Funcionalidade: Diagnóstico GA4**
Criada função específica para investigar problemas em propriedades GA4:

#### **Endpoint de Diagnóstico**:
```bash
GET /api/google-analytics/accounts/290353757/diagnose
```

#### **Testes Implementados**:

1. **✅ Estrutura das Credenciais**
   - Validação do arquivo JSON do Service Account
   - Verificação de campos obrigatórios (project_id, client_email, private_key)
   - Análise de consistência entre dados salvos e arquivo

2. **✅ Consulta Básica (sessions)**
   - Teste mínimo: apenas métrica `sessions`
   - Período: último dia
   - Limite: 1 linha

3. **✅ Múltiplas Métricas GA4**
   - Teste com: `sessions`, `users`, `screenPageViews`
   - Período: últimos 7 dias
   - Limite: 5 linhas

4. **✅ Consulta com Dimensões**
   - Teste com dimensão `date`
   - Métrica: `sessions`
   - Limite: 10 linhas

5. **✅ Verificação de Tipo GA4**
   - Teste com métrica `engagedSessions` (específica GA4)
   - Confirma se é propriedade GA4 ou Universal Analytics

### **🔍 Logs Detalhados Especiais**
Para a propriedade 290353757, implementado diagnóstico que captura:

```javascript
🔍 DIAGNÓSTICO DETALHADO para propriedade 290353757:
   📋 Nome da propriedade: [Nome]
   📧 Service Account: [Email]
   📅 Última sincronização: [Data]
   🔑 Credenciais encontradas: SIM/NÃO
   📊 Datas consultadas: [startDate] até [endDate]
   ⚙️ Métricas solicitadas: sessions, users, screenPageViews
   🚨 Tipo do erro: [Error Code]
   📝 Mensagem completa: [Error Message]
   📚 Stack trace: [Detalhes técnicos]
   🔐 Project ID das credenciais: [Project ID]
   👤 Client Email: [Service Account Email]
   🆔 Client ID: [Client ID]
   🔑 Tipo de conta: [service_account]
```

## 🎯 **Como Usar o Sistema de Diagnóstico**

### **1️⃣ Executar Diagnóstico Completo**:
```bash
# Via API (Postman/curl)
GET http://localhost:5000/api/google-analytics/accounts/290353757/diagnose
Authorization: Bearer [SEU_TOKEN]
```

### **2️⃣ Observar Logs do Backend**:
```bash
# No terminal do backend
npm start
# Aguardar logs detalhados quando erro ocorrer
```

### **3️⃣ Analisar Resposta JSON**:
```json
{
  "status": "success",
  "data": {
    "propertyId": "290353757",
    "propertyName": "Nome da Propriedade",
    "serviceAccountEmail": "email@projeto.iam.gserviceaccount.com",
    "tests": [
      {
        "name": "Estrutura das Credenciais",
        "status": "success|error|warning",
        "message": "Detalhes do teste"
      }
    ],
    "credentials": {
      "projectId": "projeto-123",
      "clientEmail": "service@projeto.iam.gserviceaccount.com",
      "type": "service_account"
    },
    "recommendations": [
      "Lista de ações recomendadas"
    ],
    "summary": {
      "status": "healthy|partial|critical",
      "message": "Resumo do diagnóstico"
    }
  }
}
```

## 🔧 **Próximos Passos para Investigação**

### **1️⃣ Testar o Sistema**:
1. Reiniciar o backend
2. Acessar o dashboard (vai gerar o erro automaticamente)
3. Observar os logs detalhados
4. Executar endpoint de diagnóstico

### **2️⃣ Analisar os Resultados**:
- ✅ **Se todos os testes passarem**: Problema resolvido
- ⚠️ **Se alguns testes falharem**: Problema específico identificado
- ❌ **Se todos os testes falharem**: Problema crítico de configuração

### **3️⃣ Ações Baseadas nos Resultados**:

#### **Para erro de Permissão**:
- Verificar se Service Account foi adicionado como usuário na propriedade GA4
- Verificar nível de permissão (Viewer mínimo)

#### **Para erro INVALID_ARGUMENT**:
- Verificar se propriedade é GA4 (não Universal Analytics)
- Verificar se ID da propriedade está correto

#### **Para erro Not Found**:
- Verificar se propriedade existe e está ativa
- Verificar se Service Account tem acesso ao projeto correto

## 📊 **Status Atual do Sistema**

### **✅ Alterações Implementadas**:
- [x] **Proteções removidas** de todos os controllers
- [x] **Sistema de diagnóstico** implementado
- [x] **Logs detalhados** adicionados especificamente para 290353757
- [x] **Rota de diagnóstico** criada (/diagnose)
- [x] **Testes progressivos** implementados

### **🎯 Objetivo**:
**Descobrir a causa raiz do problema INVALID_ARGUMENT na propriedade 290353757 através de investigação detalhada e testes progressivos.**

---
*Sistema de investigação implementado em 24/05/2025 - SpeedFunnels Team* 