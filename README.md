# SpeedFunnels - Sistema de Relatórios para Meta Ads e Google Analytics

Sistema completo para agências de marketing digital que permite visualizar e analisar dados do Meta Ads e Google Analytics de forma consolidada.

## ✨ Funcionalidades Principais

### 🔐 Autenticação e Permissões
- **Super Admin**: Acesso total ao sistema, pode criar empresas e usuários
- **Usuários**: Acesso segmentado apenas à empresa designada
- Sistema JWT com refresh tokens
- Controle de permissões por níveis

### 🏢 Gestão de Empresas
- Interface administrativa para múltiplas empresas
- Isolamento completo de dados entre empresas
- Vinculação de contas Meta Ads e Google Analytics por empresa
- Gerenciamento de usuários por empresa

### 📊 Dashboard Analítico
- Visualização consolidada de dados Meta Ads + Google Analytics
- Métricas principais: gastos, impressões, sessões, CTR, etc.
- Gráficos interativos com Recharts
- Filtros por período e contas específicas
- Comparação entre múltiplas contas

### 🔗 Integrações APIs
- **Meta Ads**: Conexão via token de acesso, coleta de campanhas e insights
- **Google Analytics**: Conexão via Service Account, dados GA4
- Credenciais criptografadas com segurança
- Testes automáticos de conectividade

## 🚀 Tecnologias Utilizadas

### Backend
- **Node.js** + **Express.js** - API RESTful
- **MongoDB** + **Mongoose** - Banco de dados
- **JWT** - Autenticação
- **facebook-nodejs-business-sdk** - Meta Ads API
- **@google-analytics/data** - Google Analytics API
- **Bcrypt** - Hash de senhas
- **Helmet** - Segurança HTTP

### Frontend
- **React** + **Vite** - Interface de usuário
- **Material-UI** - Framework de componentes
- **React Router** - Roteamento
- **Recharts** - Visualização de dados
- **Axios** - Cliente HTTP

## 📁 Estrutura do Projeto

```
speedfunnels/
├── backend/                 # API Node.js
│   ├── src/
│   │   ├── controllers/     # Controladores
│   │   ├── models/         # Modelos MongoDB
│   │   ├── routes/         # Rotas da API
│   │   ├── middleware/     # Middlewares
│   │   └── app.js          # Aplicação principal
│   ├── .env                # Variáveis de ambiente
│   └── package.json
├── frontend/               # Interface React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── contexts/       # Contextos React
│   │   ├── services/       # Serviços de API
│   │   └── App.jsx         # Aplicação principal
│   ├── .env                # Configuração frontend
│   └── package.json
├── funcionalidades.md      # Lista de funcionalidades
├── plan-dev.md            # Planejamento de desenvolvimento
└── README.md              # Esta documentação
```

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Node.js (v18+)
- MongoDB Atlas ou MongoDB local
- Conta Meta Ads com token de acesso
- Projeto Google Analytics com Service Account

### 1. Backend

```bash
cd backend
npm install
```

Configure o arquivo `.env` com suas credenciais:

```env
# Database
MONGODB_URI=sua_string_de_conexao_mongodb

# JWT
JWT_SECRET=sua_chave_secreta_jwt
JWT_REFRESH_SECRET=sua_chave_refresh_jwt

# Server
PORT=5000
NODE_ENV=development

# Security
BCRYPT_SALT_ROUNDS=12
CRYPTO_SECRET_KEY=sua_chave_para_criptografia
```

Inicie o servidor:

```bash
npm start
# ou para desenvolvimento
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
```

Configure o arquivo `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Inicie o desenvolvimento:

```bash
npm run dev
```

## 🔧 Criando Super Admin

Execute este script para criar o primeiro usuário super admin:

```bash
cd backend
node scripts/createSuperAdmin.js
```

## 📱 Como Usar

### 1. Login
- Acesse `http://localhost:5173`
- Faça login com as credenciais do super admin

### 2. Criar Empresa
- Vá para "Empresas" (apenas super admin)
- Clique em "Nova Empresa"
- Preencha os dados da empresa

### 3. Adicionar Contas Meta Ads
- Acesse "Meta Ads"
- Clique em "Adicionar Conta"
- Insira o ID da conta e o token de acesso

### 4. Adicionar Google Analytics
- Acesse "Google Analytics"
- Clique em "Adicionar Propriedade"
- Faça upload do arquivo JSON do Service Account
- Insira o Property ID

### 5. Visualizar Dashboard
- Vá para "Dashboard"
- Selecione período e contas desejadas
- Visualize métricas consolidadas

## 🔐 Configuração de Integrações

### Meta Ads
1. Acesse o [Facebook Developers](https://developers.facebook.com/)
2. Crie um app e obtenha o token de acesso
3. Configure permissões para `ads_read`

### Google Analytics
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um Service Account
3. Baixe o arquivo JSON das credenciais
4. Adicione o email do Service Account como usuário no Google Analytics

## 📊 APIs Disponíveis

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Perfil do usuário

### Administração (Super Admin)
- `GET /api/admin/companies` - Listar empresas
- `POST /api/admin/companies` - Criar empresa
- `PUT /api/admin/companies/:id` - Atualizar empresa

### Meta Ads
- `GET /api/meta-ads/accounts` - Listar contas
- `POST /api/meta-ads/accounts` - Adicionar conta
- `GET /api/meta-ads/accounts/:id/campaigns` - Campanhas
- `GET /api/meta-ads/accounts/:id/insights` - Insights

### Google Analytics
- `GET /api/google-analytics/accounts` - Listar propriedades
- `POST /api/google-analytics/accounts` - Adicionar propriedade
- `GET /api/google-analytics/accounts/:id/data` - Dados

### Dashboard
- `GET /api/dashboard/data` - Dados consolidados
- `POST /api/dashboard/configs` - Salvar configuração

## 🗄️ Modelos de Dados

### User
- name, email, password
- role: 'super_admin' | 'admin' | 'user'
- company (referência)

### Company
- name, email, cnpj, phone
- metaAccounts (array de contas Meta)
- googleAnalyticsAccounts (array de propriedades GA)
- settings, subscription

### DashboardConfig
- name, description
- widgets, layout, filters
- user, company (referências)

## 🔒 Segurança

- Senhas criptografadas com bcrypt
- Credenciais de APIs criptografadas
- Tokens JWT com expiração
- Isolamento de dados por empresa
- Validação de entrada em todas as APIs
- Rate limiting (planejado)

## 📈 Status do Desenvolvimento

### ✅ Concluído
- [x] Sistema de autenticação completo
- [x] Gestão de empresas e usuários
- [x] Integração Meta Ads
- [x] Integração Google Analytics
- [x] Dashboard com dados consolidados
- [x] Interface React funcional
- [x] API REST completa

### 🔄 Em Desenvolvimento
- [ ] Editor de métricas drag-and-drop
- [ ] Sistema de relatórios avançados
- [ ] Exportação em PDF
- [ ] Compartilhamento de relatórios

### 📋 Planejado
- [ ] Automação de relatórios
- [ ] Alertas e notificações
- [ ] Análise preditiva
- [ ] Mais integrações (Google Ads, LinkedIn, etc.)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC.

## 🆘 Suporte

Para dúvidas e suporte:
- Abra uma issue no GitHub
- Consulte a documentação em `funcionalidades.md` e `plan-dev.md`

---

**SpeedFunnels** - Sistema completo para análise de dados de marketing digital 🚀 