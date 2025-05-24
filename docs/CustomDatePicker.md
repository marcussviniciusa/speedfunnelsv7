# CustomDatePicker - Componente de Seleção de Data Personalizada

## Visão Geral

O `CustomDatePicker` é um componente React que combina a facilidade de períodos pré-definidos com a flexibilidade de um calendário personalizado. Foi desenvolvido especificamente para o sistema de relatórios, integrando-se perfeitamente com Material-UI e fornecendo uma experiência de usuário intuitiva.

## Funcionalidades

### ✅ Períodos Pré-definidos
- **Hoje** - Data atual
- **Ontem** - Dia anterior
- **Últimos 7 dias** - Semana passada
- **Últimos 30 dias** - Mês passado
- **Últimos 90 dias** - Trimestre passado
- **Este mês** - Do 1º dia do mês atual até hoje
- **Mês passado** - Mês anterior completo
- **Personalizado** - Abre calendário para seleção manual

### ✅ Calendário Personalizado
- Interface visual com `react-datepicker`
- Seleção de intervalo de datas (range)
- Navegação por mês e ano com dropdowns
- Localização em português brasileiro
- Limitação até a data atual (não permite datas futuras)
- Design responsivo para mobile e desktop

### ✅ Integração com Backend
- Conversão automática para formato `YYYY-MM-DD` (ISO)
- Compatibilidade com APIs Meta Ads e Google Analytics
- Detecção automática de formato de data recebido
- Suporte a datas relativas e absolutas

## Uso no Sistema

### Dashboard
```jsx
<CustomDatePicker
  startDate={dateRange.startDate}
  endDate={dateRange.endDate}
  onChange={handleDateRangeChange}
  label="Período"
/>
```

### Relatórios
```jsx
<CustomDatePicker
  startDate={reportConfig.startDate}
  endDate={reportConfig.endDate}
  onChange={(dateRange) => setReportConfig({ 
    ...reportConfig, 
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  })}
  label="Período do Relatório"
  size="small"
/>
```

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `startDate` | `string` | - | Data inicial (formato YYYY-MM-DD ou período relativo) |
| `endDate` | `string` | - | Data final (formato YYYY-MM-DD ou período relativo) |
| `onChange` | `function` | - | Callback executado quando as datas mudam |
| `label` | `string` | 'Período' | Label do campo select |
| `variant` | `string` | 'outlined' | Variante do Material-UI |
| `size` | `string` | 'medium' | Tamanho do componente |
| `disabled` | `boolean` | `false` | Se o componente está desabilitado |

## Estrutura de Dados

### Entrada (Props)
```javascript
{
  startDate: "30daysAgo" | "2024-01-15",
  endDate: "today" | "2024-02-15"
}
```

### Saída (onChange)
```javascript
{
  startDate: "2024-01-15", // Sempre formato YYYY-MM-DD
  endDate: "2024-02-15"    // Sempre formato YYYY-MM-DD
}
```

## Estilos Personalizados

O componente utiliza CSS personalizado (`datepicker-custom.css`) que:
- Aplica as cores do Material-UI (#1976d2)
- Mantém consistência visual com o resto da aplicação
- Oferece experiência responsiva
- Customiza todos os elementos do react-datepicker

### Principais Customizações
- Header azul Material-UI
- Dias selecionados em azul
- Hover effects suaves
- Navegação customizada
- Dropdowns estilizados
- Responsividade para mobile

## Conversão de Datas

### Backend Support
O backend foi atualizado para suportar os novos períodos:

```javascript
// dashboardController.js e reportsController.js
const convertDateToISO = (dateString) => {
  const today = new Date();
  
  switch (dateString) {
    case 'today': return today.toISOString().split('T')[0];
    case 'yesterday': /* ... */
    case 'thisMonth': /* Primeiro dia do mês atual */
    case 'lastMonth': /* Primeiro dia do mês passado */
    // ... outros casos
    default: return dateString; // Datas já em formato YYYY-MM-DD
  }
};
```

## Implementação Técnica

### Detecção Automática de Formato
```javascript
useEffect(() => {
  if (startDate && endDate) {
    // Detecta período relativo
    if (typeof startDate === 'string' && predefinedRanges.find(r => r.value === startDate)) {
      setDateRange(startDate);
      setShowCustomPicker(false);
      return;
    }

    // Detecta data personalizada (YYYY-MM-DD)
    if (typeof startDate === 'string' && startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setDateRange('custom');
      setCustomStartDate(new Date(startDate));
      setCustomEndDate(new Date(endDate));
      setShowCustomPicker(true);
      return;
    }
  }
}, [startDate, endDate]);
```

### Gerenciamento de Estado
```javascript
const [dateRange, setDateRange] = useState('30daysAgo');           // Período selecionado
const [customStartDate, setCustomStartDate] = useState(null);      // Data inicial custom
const [customEndDate, setCustomEndDate] = useState(null);          // Data final custom
const [showCustomPicker, setShowCustomPicker] = useState(false);   // Mostra/esconde calendário
```

## Benefícios

1. **UX Melhorada**: Combina rapidez de seleção pré-definida com flexibilidade personalizada
2. **Consistência**: Integração visual perfeita com Material-UI
3. **Flexibilidade**: Suporta tanto datas relativas quanto absolutas
4. **Responsividade**: Funciona bem em desktop e mobile
5. **Localização**: Interface em português brasileiro
6. **Validação**: Previne seleção de datas futuras
7. **Performance**: Conversões eficientes e estado otimizado

## Próximos Passos

- ✅ **Implementado**: Dashboard principal
- ✅ **Implementado**: Sistema de relatórios
- 🔄 **Futuro**: Configuração de dashboards salvos
- 🔄 **Futuro**: Agendamento de relatórios automáticos
- 🔄 **Futuro**: Preset de datas personalizadas por empresa 