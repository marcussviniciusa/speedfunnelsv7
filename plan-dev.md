# Plano de Desenvolvimento - Sistema de Relatórios para Meta Ads e Google Analytics

## Stack Tecnológica Aprovada

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web para APIs RESTful
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB

### Frontend
- **React** - Biblioteca para interface de usuário
- **Vite** - Build tool e dev server
- **React Router** - Roteamento
- **Axios** - Cliente HTTP
- **Chart.js** ou **Recharts** - Visualização de dados
- **Material-UI** ou **Tailwind CSS** - Framework de UI

### Integrações de APIs
- **facebook-nodejs-business-sdk** - SDK oficial Meta Ads
- **@google-analytics/data** - SDK oficial Google Analytics Data API
- **google-auth-library** - Autenticação Google

### Autenticação e Segurança
- **JWT** - Tokens de autenticação
- **bcryptjs** - Hash de senhas
- **helmet** - Segurança HTTP

### Exportação de PDF
- **puppeteer** - Geração de PDFs a partir de HTML
- **jspdf** - Biblioteca alternativa para PDF

## Fases de Desenvolvimento

### ✅ Fase 1: Configuração Inicial e Estrutura Base
- [x] Inicialização do projeto
- [x] Configuração do ambiente de desenvolvimento
- [x] Estrutura de pastas
- [x] Configuração do MongoDB
- [x] Setup inicial do Express.js
- [x] Configuração básica do React com Vite

### ✅ Fase 2: Sistema de Autenticação
- [x] **2.1 Modelos de Dados**
  - [x] Schema de Usuário (MongoDB)
  - [x] Schema de Empresa (MongoDB)
  - [x] Schema de Permissões
  - [x] Relacionamentos entre entidades

- [x] **2.2 Autenticação Backend**
  - [x] Middleware de autenticação JWT
  - [x] Endpoints de login/logout
  - [x] Middleware de verificação de permissões
  - [x] Sistema de refresh tokens

- [x] **2.3 Interfaces de Autenticação**
  - [x] Tela de login
  - [x] Sistema de rotas protegidas
  - [x] Context de autenticação React
  - [x] Middleware de redirecionamento

- [x] **2.4 Gerenciamento de Usuários (Super Admin)**
  - [x] CRUD de empresas
  - [x] CRUD de usuários
  - [x] Atribuição de permissões
  - [x] Interface administrativa (Backend)

### ✅ Fase 3: Integração com APIs Externas
- [x] **3.1 Integração Meta Ads**
  - [x] Configuração do facebook-nodejs-business-sdk
  - [x] Endpoint para configurar conta Meta Ads
  - [x] Validação de credenciais Meta
  - [x] Coleta de dados de campanhas
  - [x] Sistema de cache de dados

- [x] **3.2 Integração Google Analytics (GA4 Data API)**
  - [x] Service Account configuração
  - [x] Autenticação com JSON credentials
  - [x] Coleta de dados GA4
  - [x] Sistema de cache de dados
  - [x] **🔧 BUG FIX COMPLETO: Upload de arquivo JSON resolvido**
    - [x] Instalado e configurado middleware multer
    - [x] Processamento correto de FormData com arquivos
    - [x] Validações aprimoradas com mensagens específicas
    - [x] Correção do erro "dados obrigatórios" mesmo preenchendo todos os campos
    - [x] **SOLUÇÃO FINAL: Content-Type no frontend corrigido**
      - [x] Removido Content-Type fixo do axios global
      - [x] Interceptor inteligente para detectar FormData
      - [x] req.body e req.file agora funcionam corretamente
  - [x] **🔧 BUG FIX: Super Admin sem Company ID resolvido**
    - [x] Implementada lógica de fallback para primeira empresa ativa
    - [x] Aplicado padrão consistente do Meta Ads no Google Analytics
    - [x] Correção em 3 funções: testConnection, getData, removeAccount
    - [x] Código limpo sem logs temporários
  - [x] **🔧 BUG FIX FINAL: Métricas GA4 incompatíveis resolvido**
    - [x] Identificada causa raiz: averageSessionDuration + bounceRate = INVALID_ARGUMENT
    - [x] Pesquisa na documentação oficial Google Analytics 4 Data API
    - [x] Removidas métricas problemáticas de Dashboard e Reports Controller
    - [x] Sistema agora usa apenas métricas básicas estáveis: sessions, users, screenPageViews
    - [x] Logs limpos sem erros repetitivos INVALID_ARGUMENT
    - [x] Dashboard e Relatórios carregando dados GA4 perfeitamente
    - [x] **PROTEÇÃO TOTAL**: Validação automática em getAnalyticsData()
      - [x] Lista de métricas seguras implementada (9 métricas aprovadas)
      - [x] Filtragem automática de métricas incompatíveis
      - [x] Logs informativos para métricas removidas
      - [x] Fallback seguro para métricas básicas
      - [x] Sistema 100% imune a erros INVALID_ARGUMENT

- [x] **3.3 Gerenciamento de Integrações**
  - [x] Schema para armazenar credenciais (criptografadas)
  - [x] Interface para adicionar/remover contas
  - [x] Validação de conexões
  - [x] Status de saúde das integrações

### ✅ Fase 4: Dashboard e Visualização de Dados
- [x] **4.1 Coleta e Processamento de Dados**
  - [x] Normalização de dados Meta + GA
  - [x] Sistema de sincronização periódica
  - [x] Agregação de métricas
  - [x] Estrutura de dados unificada

- [x] **4.2 Interface de Dashboard Básica**
  - [x] Dashboard com gráficos funcionais
  - [x] Métricas principais (gastos, impressões, sessões)
  - [x] Filtros por período
  - [x] **Seleção de data personalizada implementada:**
    - [x] Componente CustomDatePicker criado
    - [x] Períodos pré-definidos (Hoje, Ontem, 7/30/90 dias, Este/Último mês)
    - [x] Calendário personalizado com react-datepicker
    - [x] Integração com Material-UI e estilização customizada
    - [x] Suporte a datas relativas e formato YYYY-MM-DD
    - [x] Backend atualizado para novos períodos (thisMonth, lastMonth)
    - [x] Implementado no Dashboard e Sistema de Relatórios
    - [x] **🔧 BUG FIX: Correção de fuso horário implementada**
      - [x] Função parseLocalDate() criada para evitar problemas de UTC
      - [x] Datas agora correspondem exatamente ao selecionado pelo usuário
      - [x] Correção validada com testes (ex: 17/03/2025 agora fica 17/03/2025)
  - [x] Layout responsivo
  - [x] Resolução automática de empresa para super admin

- [x] **4.3 Visualizações e Gráficos**
  - [x] Componentes de gráficos com Recharts
  - [x] Gráficos de barras para comparação
  - [x] Cards de métricas principais
  - [x] Filtros dinâmicos básicos
  - [x] Formatação de moeda e números

- [x] **4.4 Salvamento de Configurações**
  - [x] Sistema de templates de dashboard
  - [x] Configurações específicas por usuário
  - [x] Configurações por cliente/empresa
  - [x] Versionamento de templates

- [ ] **4.5 Editor Avançado (Futuro)**
  - [ ] Interface drag-and-drop para widgets
  - [ ] Seletor de métricas customizáveis
  - [ ] Preview em tempo real
  - [ ] Comparação entre períodos

### ✅ Fase 5: Sistema de Relatórios
- [x] **5.1 Geração de Relatórios**
  - [x] Sistema de filtros avançados com QueryBuilder drag-and-drop
  - [x] Segmentação de dados por Meta Ads e Google Analytics
  - [x] 6 relatórios pré-definidos configurados
  - [x] Interface de relatórios personalizados com 3 abas
  - [x] 4 endpoints backend: generate, fields, predefined, segmentation-options
  - [x] Middleware requirePermission implementado

- [x] **5.2 Análise e Visualização**
  - [x] Seleção de contas Meta Ads e perfis Google Analytics
  - [x] Visualização consolidada com gráficos Recharts
  - [x] Comparação entre contas e campanhas
  - [x] Tabelas detalhadas com dados Meta Ads e GA
  - [x] Gráficos: BarChart, AreaChart, LineChart
  - [x] Cards de métricas resumidas (gasto, sessões, ROI, campanhas)
  - [x] Sistema de filtros por período, tipo de relatório, segmentação

### 📋 Fase 6: Exportação em PDF
- [ ] **6.1 Engine de PDF**
  - [ ] Configuração do Puppeteer
  - [ ] Templates HTML para PDF
  - [ ] Renderização de gráficos em PDF
  - [ ] Preservação de layouts customizados

- [ ] **6.2 Editor de Relatório PDF**
  - [ ] Interface para seleção de componentes
  - [ ] Preview do PDF antes da exportação
  - [ ] Configuração de layout
  - [ ] Templates reutilizáveis

- [ ] **6.3 Personalização Visual**
  - [ ] Upload de logotipo da empresa
  - [ ] Cores personalizadas
  - [ ] Cabeçalhos e rodapés customizados
  - [ ] Formatação de texto

### 📋 Fase 7: Compartilhamento Controlado
- [ ] **7.1 Sistema de Links**
  - [ ] Geração de links temporários
  - [ ] Configuração de expiração
  - [ ] Controle de acesso
  - [ ] Log de acessos

- [ ] **7.2 Distribuição de Relatórios**
  - [ ] Envio por email
  - [ ] Download direto
  - [ ] Versionamento de relatórios

## Detalhamento Técnico por Integração

### Meta Ads Integration (Facebook Business SDK)
```javascript
// Configuração baseada na documentação atual
const adsSdk = require('facebook-nodejs-business-sdk');
const accessToken = process.env.META_ACCESS_TOKEN;
const api = adsSdk.FacebookAdsApi.init(accessToken);

// Coleta de dados de campanhas
const AdAccount = adsSdk.AdAccount;
const Campaign = adsSdk.Campaign;
const account = new AdAccount('act_<AD_ACCOUNT_ID>');

// Paginação automática para grandes volumes
const campaigns = await account.getCampaigns([
  Campaign.Fields.name,
  Campaign.Fields.status,
  Campaign.Fields.spend,
  Campaign.Fields.impressions
], { limit: 100 });
```

### Google Analytics Integration (GA4 Data API)
```javascript
// Configuração baseada na documentação atual
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

// Autenticação via Service Account
const analyticsDataClient = new BetaAnalyticsDataClient({
  keyFilename: 'path/to/service-account-key.json'
});

// Coleta de dados GA4
const [response] = await analyticsDataClient.runReport({
  property: `properties/${propertyId}`,
  dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
  dimensions: [{ name: 'country' }, { name: 'city' }],
  metrics: [{ name: 'activeUsers' }, { name: 'sessions' }]
});
```

## Estrutura de Arquivos Planejada

```
speedfunnels/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.js
│   │   │   ├── companies.js
│   │   │   ├── users.js
│   │   │   ├── metaAds.js
│   │   │   ├── googleAnalytics.js
│   │   │   ├── dashboard.js
│   │   │   └── reports.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Company.js
│   │   │   ├── MetaAccount.js
│   │   │   ├── GAAccount.js
│   │   │   └── Dashboard.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── permissions.js
│   │   ├── services/
│   │   │   ├── metaAdsService.js
│   │   │   ├── googleAnalyticsService.js
│   │   │   └── pdfService.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── admin.js
│   │   │   ├── dashboard.js
│   │   │   └── reports.js
│   │   └── app.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   ├── Dashboard/
│   │   │   ├── Admin/
│   │   │   └── Reports/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── funcionalidades.md
├── plan-dev.md
└── README.md
```

## Cronograma Estimado

- **Fase 1**: 3-5 dias
- **Fase 2**: 7-10 dias  
- **Fase 3**: 10-14 dias
- **Fase 4**: 14-18 dias
- **Fase 5**: 7-10 dias
- **Fase 6**: 10-12 dias
- **Fase 7**: 5-7 dias

**Total Estimado**: 56-76 dias de desenvolvimento

## Próximos Passos Imediatos

1. **Configurar MongoDB** - Criar cluster e configurar conexão
2. **Setup inicial Express.js** - Estrutura básica da API
3. **Configurar React com Vite** - Interface base
4. **Implementar autenticação JWT** - Sistema de login básico
5. **Testar integrações Meta e Google** - Validar conectividade

## Considerações de Segurança

- Criptografia de credenciais no banco de dados
- Validação de entrada em todas as APIs
- Rate limiting para APIs externas
- Logs de auditoria para ações sensíveis
- HTTPS obrigatório em produção
- Sanitização de dados de entrada

## Observações Técnicas

- Usar variáveis de ambiente para todas as credenciais
- Implementar sistema de cache para reduzir calls nas APIs
- Considerar implementação de fila para processamento de dados
- Otimizar queries do MongoDB com índices apropriados
- Implementar monitoramento de saúde das integrações 