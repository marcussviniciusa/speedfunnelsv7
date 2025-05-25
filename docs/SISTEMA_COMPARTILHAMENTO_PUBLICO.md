# 🔗 Sistema de Compartilhamento Público de Relatórios

## 📋 Visão Geral

O **Sistema de Compartilhamento Público** permite que os usuários do SpeedFunnels compartilhem relatórios através de URLs públicas, sem necessidade de autenticação para visualização. Este sistema oferece controles robustos de segurança, personalização e analytics de acesso.

## ✨ Funcionalidades Implementadas

### 🔐 **Segurança e Controle de Acesso**
- **Proteção por senha**: Relatórios podem ser protegidos com senha personalizada
- **Data de expiração**: Configure quando o link deve expirar automaticamente  
- **Domínios permitidos**: Restrinja acesso apenas a domínios específicos
- **Ativação/Desativação**: Controle se o relatório está acessível publicamente
- **Criptografia**: Senhas são criptografadas com bcrypt no banco de dados

### 🎨 **Personalização Visual**
- **Temas visuais**: 3 temas disponíveis (Claro, Escuro, Corporativo)
- **Logo personalizado**: URL de imagem customizada no cabeçalho
- **Controle de branding**: Opção de mostrar/ocultar informações da empresa
- **Design responsivo**: Interface adaptada para todos os dispositivos

### 📊 **Analytics e Estatísticas**
- **Contador de visualizações**: Total de acessos ao relatório
- **Visitantes únicos**: Rastreamento por IP único
- **Geolocalização**: Estatísticas por país de acesso (configurável)
- **Histórico detalhado**: Data/hora de primeiro e último acesso por IP
- **Top visualizadores**: Lista dos IPs que mais acessaram

### 🛠️ **Gerenciamento Completo**
- **Interface administrativa**: Painel para listar e gerenciar compartilhamentos
- **Filtros e busca**: Encontre compartilhamentos por título, status, etc.
- **Edição inline**: Atualize configurações sem recriar o compartilhamento
- **Operações em lote**: Ações rápidas como copiar URL, abrir público, etc.

## 🏗️ Arquitetura Implementada

### **Backend (Node.js + MongoDB)**

#### 1. **Modelo de Dados** (`SharedReport.js`)
```javascript
{
  shareId: String,           // ID único para URL pública
  companyId: ObjectId,       // Empresa proprietária
  reportData: Mixed,         // Dados do relatório
  reportConfig: Mixed,       // Configuração do relatório
  shareSettings: {
    title: String,           // Título público
    description: String,     // Descrição opcional
    isActive: Boolean,       // Se está ativo
    password: String,        // Senha criptografada
    expiresAt: Date,         // Data de expiração
    allowedDomains: [String], // Domínios permitidos
    theme: String,           // Tema visual
    customLogo: String       // URL do logo
  },
  accessStats: {
    totalViews: Number,      // Total de visualizações
    uniqueViewers: Number,   // Visitantes únicos
    viewerIPs: [Object],     // Detalhes por IP
    viewerCountries: [Object] // Estatísticas por país
  }
}
```

#### 2. **Controller** (`sharedReportsController.js`)
- `createSharedReport`: Criar novo compartilhamento
- `getPublicReport`: Acessar relatório público (sem autenticação)
- `listSharedReports`: Listar compartilhamentos da empresa
- `updateSharedReport`: Atualizar configurações
- `deleteSharedReport`: Remover compartilhamento
- `getReportStats`: Estatísticas detalhadas

#### 3. **Rotas** (`/api/shared-reports`)
```
POST /                          # Criar compartilhamento
GET  /                          # Listar compartilhamentos
GET  /public/:shareId           # Acessar público (sem auth)
POST /public/:shareId           # Acessar público com senha
PUT  /:shareId                  # Atualizar configurações  
DELETE /:shareId                # Remover compartilhamento
GET  /:shareId/stats            # Estatísticas detalhadas
```

### **Frontend (React + Material-UI)**

#### 1. **Componentes Principais**

**`ReportShareDialog.jsx`**: Dialog para criar/configurar compartilhamentos
- Formulário completo com validações
- Configurações básicas e avançadas
- Preview da URL gerada
- Integração com DateTimePicker

**`SharedReportsManager.jsx`**: Gerenciador de compartilhamentos
- Lista em cards com informações relevantes
- Filtros por status e busca por texto
- Ações rápidas (copiar, abrir, editar, remover)
- Dialogs para estatísticas detalhadas

**`PublicReportViewer.jsx`**: Página pública para visualização
- Sistema de temas dinâmicos
- Formulário de senha quando necessário
- Tratamento de erros (404, 410, 403)
- Cabeçalho personalizado com logo e estatísticas

#### 2. **Integração no Sistema**
- **Botão de compartilhamento** em `ReportVisualization.jsx`
- **Nova aba "Compartilhamentos"** em `Reports.jsx`
- **Rota pública** `/public/report/:shareId` no `App.jsx`
- **API service** em `services/api.js`

## 🚀 Como Usar

### **1. Compartilhar um Relatório**
1. Acesse a página **Relatórios**
2. Gere um relatório na aba **"Relatórios Personalizados"**
3. Na aba **"Resultados"**, clique no botão **🔗 Compartilhar** (azul destacado)
4. Configure as opções no dialog:
   - **Título**: Nome que aparecerá na página pública
   - **Descrição**: Informações adicionais (opcional)
   - **Tema**: Claro, Escuro ou Corporativo
   - **Configurações avançadas**:
     - Senha de proteção
     - Data de expiração
     - Domínios permitidos
     - Logo personalizado
5. Clique em **"Compartilhar Relatório"**
6. **Copie a URL gerada** ou abra em nova aba para testar

### **2. Gerenciar Compartilhamentos**
1. Na página **Relatórios**, vá para a aba **🔗 Compartilhamentos**
2. Visualize todos os relatórios compartilhados em cards
3. Use a **busca** para encontrar compartilhamentos específicos
4. **Ações disponíveis** em cada card:
   - **📋 Copiar URL**: Copia link para área de transferência
   - **🌐 Abrir Público**: Abre relatório em nova aba
   - **📊 Ver Estatísticas**: Mostra analytics detalhados
   - **🗑️ Remover**: Exclui o compartilhamento

### **3. Acessar Relatório Público**
1. **Acesse a URL compartilhada** (formato: `/public/report/{shareId}`)
2. **Se houver senha**: Digite a senha no formulário
3. **Visualize o relatório** com tema personalizado
4. **Download PDF** (se permitido) através do botão no cabeçalho

## 🔧 Configuração de Segurança

### **Variáveis de Ambiente Necessárias**
```bash
# Backend
FRONTEND_URL=http://localhost:3000  # URL do frontend para gerar links públicos
CRYPTO_SECRET_KEY=sua_chave_de_32_bytes_hex  # Para criptografia de senhas

# MongoDB
MONGODB_URI=mongodb://localhost:27017/speedfunnels
```

### **Controles de Segurança Implementados**
- ✅ **Senhas criptografadas** com bcrypt
- ✅ **Verificação de domínios** via headers Origin/Referer
- ✅ **Expiração automática** com índices TTL do MongoDB
- ✅ **Rate limiting** nativo do Express
- ✅ **Validação de entrada** em todos os endpoints
- ✅ **Isolamento por empresa** (tenant isolation)

## 📈 Estatísticas e Analytics

### **Métricas Coletadas**
- **Total de visualizações**: Contador global
- **Visitantes únicos**: Baseado em IP único
- **Países de acesso**: Via análise de IP (opcional)
- **Histórico por IP**: Primeira/última visualização, total de acessos
- **Timeline de acesso**: Data e hora de cada visualização

### **Relatórios Disponíveis**
- **Dashboard do compartilhamento**: Visualizações totais e únicas
- **Top visualizadores**: IPs que mais acessaram
- **Distribuição geográfica**: Acessos por país
- **Análise temporal**: Padrões de acesso ao longo do tempo

## 🎯 URLs e Endpoints

### **Frontend - Rotas**
- `/reports` - Sistema de relatórios (com aba de compartilhamentos)
- `/public/report/:shareId` - Página pública do relatório

### **Backend - API**
- `POST /api/shared-reports` - Criar compartilhamento
- `GET /api/shared-reports` - Listar compartilhamentos da empresa
- `GET /api/shared-reports/public/:shareId` - Acessar relatório público
- `POST /api/shared-reports/public/:shareId` - Acessar com senha
- `PUT /api/shared-reports/:shareId` - Atualizar configurações
- `DELETE /api/shared-reports/:shareId` - Remover compartilhamento
- `GET /api/shared-reports/:shareId/stats` - Estatísticas detalhadas

## ✅ Status da Implementação

### **✅ Completo**
- [x] **Backend completo** com todas as funcionalidades
- [x] **Frontend completo** com interface administrativa
- [x] **Página pública** com todos os recursos
- [x] **Sistema de temas** dinâmicos
- [x] **Controles de segurança** robustos
- [x] **Analytics de acesso** detalhados
- [x] **Integração completa** no sistema existente

### **🎯 Melhorias Futuras** (Opcionais)
- [ ] **Comentários públicos** nos relatórios
- [ ] **Download de PDF** funcional
- [ ] **Notificações** de acesso por email
- [ ] **API pública** para embedar relatórios
- [ ] **Watermarks** personalizados
- [ ] **Análise de tempo** na página (heatmaps)

## 🔗 Links Importantes

- **Documentação do projeto**: `funcionalidades.md`
- **Backend**: `backend/src/controllers/sharedReportsController.js`
- **Frontend**: `frontend/src/components/Reports/`
- **Modelo de dados**: `backend/src/models/SharedReport.js`
- **API de compartilhamento**: `frontend/src/services/api.js`

---

**🎉 Sistema de Compartilhamento Público implementado com sucesso!**

O SpeedFunnels agora possui um sistema completo e profissional para compartilhar relatórios publicamente, com controles robustos de segurança, personalização visual e analytics detalhados de acesso. 