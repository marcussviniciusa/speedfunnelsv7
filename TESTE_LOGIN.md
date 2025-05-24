# Teste de Login - SpeedFunnels

## Problemas Identificados e Correções

### ✅ Problema 1: Login/Autenticação (RESOLVIDO)
O problema estava em duas inconsistências no código:

1. **Rota incorreta**: O frontend estava chamando `/auth/profile` mas o backend implementa `/auth/me`
2. **Nome do campo**: O backend retorna `accessToken` mas o frontend estava esperando `token`

### ✅ Problema 2: Dashboard APIs 400 Error (RESOLVIDO)
O problema era que o **super admin** não tinha empresa associada, mas as APIs esperavam um `companyId`:

1. **Super admin precisa de companyId**: As rotas Meta Ads e Dashboard exigiam companyId
2. **Solução implementada**: Quando super admin não especifica companyId, usa automaticamente a primeira empresa ativa

## Correções Aplicadas

### ✅ Arquivo: `frontend/src/services/api.js`
```javascript
// ANTES
getProfile: () => api.get('/auth/profile')

// DEPOIS
getProfile: () => api.get('/auth/me')
```

### ✅ Arquivo: `frontend/src/contexts/AuthContext.jsx`
```javascript
// ANTES
const { user, token, refreshToken } = response.data.data;
localStorage.setItem('token', token);

// DEPOIS
const { user, accessToken, refreshToken } = response.data.data;
localStorage.setItem('token', accessToken);
```

### ✅ Arquivo: `backend/src/controllers/dashboardController.js`
```javascript
// ANTES
if (req.user.role === 'super_admin') {
  companyId = req.query.companyId;
  if (!companyId) {
    return res.status(400).json({
      message: 'ID da empresa é obrigatório para super admin'
    });
  }
}

// DEPOIS  
if (req.user.role === 'super_admin') {
  companyId = req.query.companyId;
  if (!companyId) {
    const firstCompany = await Company.findOne({ isActive: true });
    companyId = firstCompany._id;
  }
}
```

### ✅ Arquivo: `backend/src/controllers/metaAdsController.js`
```javascript
// Aplicada a mesma lógica para resolver companyId automaticamente
```

## Como Testar

### 1. Verificar se os serviços estão rodando
```bash
# Backend (porta 5000)
curl http://localhost:5000/api

# Frontend (porta 5173)
curl http://localhost:5173
```

### 2. Credenciais de Teste
- **Email**: admin@speedfunnels.com
- **Senha**: admin123456

### 3. Teste Passo a Passo

1. **Abrir o navegador**: http://localhost:5173
2. **Login**: Use as credenciais acima
3. **Verificar console**: Deve aparecer "✅ Autenticação restaurada com sucesso"
4. **Navegar entre páginas**: Dashboard, configurações, etc.
5. **Recarregar página**: Deve manter o login ativo
6. **Abrir nova aba**: Deve continuar logado

### 4. Console Debug

O sistema agora mostra logs úteis no console do navegador:
- `✅ Autenticação restaurada com sucesso` - Login funcionando
- `❌ Token inválido, fazendo logout` - Problema de autenticação  
- `🔒 Nenhum token encontrado, usuário não logado` - Estado inicial

### 5. Teste de API Direta

```bash
# Fazer login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@speedfunnels.com","password":"admin123456"}'

# Testar rota protegida
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## Status dos Serviços

### ✅ Backend
- Porta: 5000
- Status: Rodando
- MongoDB: Conectado
- Super Admin: Criado
- **APIs Dashboard/Meta Ads**: ✅ FUNCIONANDO

### ✅ Frontend  
- Porta: 5173
- Status: Rodando
- API Base URL: http://localhost:5000/api
- **Login**: ✅ FUNCIONANDO
- **Dashboard**: ✅ CARREGANDO DADOS

## Próximos Passos

Se o problema persistir, verificar:
1. Console do navegador para erros JavaScript
2. Network tab para verificar requests HTTP
3. Local Storage para ver se o token está sendo salvo
4. Logs do servidor backend

## Observações Importantes

- O token tem validade de 24h por padrão
- O refresh token tem validade de 7 dias
- As credenciais do super admin devem ser alteradas em produção
- Sempre verificar se ambos os serviços estão rodando 