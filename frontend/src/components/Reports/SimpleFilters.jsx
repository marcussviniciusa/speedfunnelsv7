import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Help as HelpIcon
} from '@mui/icons-material';

const SimpleFilters = ({ value = [], onChange, reportType = 'combined' }) => {
  // Filtros disponíveis organizados por categoria
  const filterOptions = {
    meta: [
      { id: 'meta_spend', label: 'Gasto Meta Ads', type: 'number', unit: 'R$', icon: '💰' },
      { id: 'meta_impressions', label: 'Impressões', type: 'number', unit: '', icon: '👁️' },
      { id: 'meta_clicks', label: 'Cliques', type: 'number', unit: '', icon: '🖱️' },
      { id: 'meta_ctr', label: 'CTR (%)', type: 'number', unit: '%', icon: '📊' },
      { id: 'meta_cpm', label: 'CPM', type: 'number', unit: 'R$', icon: '💵' },
      { id: 'meta_campaign_name', label: 'Nome da Campanha', type: 'text', unit: '', icon: '🎯' },
      { id: 'meta_account_name', label: 'Conta Meta Ads', type: 'text', unit: '', icon: '📱' }
    ],
    ga: [
      { id: 'ga_sessions', label: 'Sessões', type: 'number', unit: '', icon: '👥' },
      { id: 'ga_users', label: 'Usuários', type: 'number', unit: '', icon: '👤' },
      { id: 'ga_pageviews', label: 'Visualizações', type: 'number', unit: '', icon: '📄' },
      { id: 'ga_bounce_rate', label: 'Taxa de Rejeição (%)', type: 'number', unit: '%', icon: '↩️' },
      { id: 'ga_session_duration', label: 'Duração da Sessão (s)', type: 'number', unit: 's', icon: '⏱️' },
      { id: 'ga_device_category', label: 'Categoria do Dispositivo', type: 'select', unit: '', icon: '📱', 
        options: ['desktop', 'mobile', 'tablet'] },
      { id: 'ga_traffic_source', label: 'Fonte de Tráfego', type: 'text', unit: '', icon: '🌐' }
    ],
    combined: [
      { id: 'total_spend', label: 'Gasto Total', type: 'number', unit: 'R$', icon: '💰' },
      { id: 'total_sessions', label: 'Total de Sessões', type: 'number', unit: '', icon: '👥' },
      { id: 'cost_per_session', label: 'Custo por Sessão', type: 'number', unit: 'R$', icon: '📈' }
    ]
  };

  // Operadores disponíveis por tipo
  const operators = {
    number: [
      { value: '=', label: 'Igual a', symbol: '=' },
      { value: '!=', label: 'Diferente de', symbol: '≠' },
      { value: '>', label: 'Maior que', symbol: '>' },
      { value: '<', label: 'Menor que', symbol: '<' },
      { value: '>=', label: 'Maior ou igual', symbol: '≥' },
      { value: '<=', label: 'Menor ou igual', symbol: '≤' }
    ],
    text: [
      { value: '=', label: 'Igual a', symbol: '=' },
      { value: '!=', label: 'Diferente de', symbol: '≠' },
      { value: 'contains', label: 'Contém', symbol: '⊃' },
      { value: 'not_contains', label: 'Não contém', symbol: '⊅' },
      { value: 'starts_with', label: 'Começa com', symbol: '⭐' },
      { value: 'ends_with', label: 'Termina com', symbol: '🏁' }
    ],
    select: [
      { value: '=', label: 'Igual a', symbol: '=' },
      { value: '!=', label: 'Diferente de', symbol: '≠' }
    ]
  };

  // Obter filtros disponíveis baseado no tipo de relatório
  const getAvailableFilters = () => {
    switch (reportType) {
      case 'meta':
        return filterOptions.meta;
      case 'ga':
        return filterOptions.ga;
      case 'combined':
      default:
        return [...filterOptions.meta, ...filterOptions.ga, ...filterOptions.combined];
    }
  };

  // Adicionar novo filtro
  const addFilter = () => {
    const newFilter = {
      id: Date.now(),
      field: '',
      operator: '=',
      value: '',
      enabled: true
    };
    onChange([...value, newFilter]);
  };

  // Remover filtro
  const removeFilter = (filterId) => {
    onChange(value.filter(filter => filter.id !== filterId));
  };

  // Atualizar filtro
  const updateFilter = (filterId, updates) => {
    onChange(value.map(filter => 
      filter.id === filterId 
        ? { ...filter, ...updates }
        : filter
    ));
  };

  // Limpar todos os filtros
  const clearAllFilters = () => {
    onChange([]);
  };

  // Obter informações do campo
  const getFieldInfo = (fieldId) => {
    const availableFilters = getAvailableFilters();
    return availableFilters.find(f => f.id === fieldId);
  };

  // Renderizar valor do filtro
  const renderFilterValue = (filter) => {
    const fieldInfo = getFieldInfo(filter.field);
    if (!fieldInfo) return null;

    if (fieldInfo.type === 'select' && fieldInfo.options) {
      return (
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={filter.value}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
            displayEmpty
          >
            <MenuItem value="">Selecione...</MenuItem>
            {fieldInfo.options.map(option => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    return (
      <TextField
        size="small"
        type={fieldInfo.type === 'number' ? 'number' : 'text'}
        value={filter.value}
        onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
        placeholder={`Digite ${fieldInfo.type === 'number' ? 'um número' : 'o texto'}`}
        sx={{ minWidth: 120 }}
        InputProps={{
          endAdornment: fieldInfo.unit && <Typography variant="caption">{fieldInfo.unit}</Typography>
        }}
      />
    );
  };

  const availableFilters = getAvailableFilters();
  const activeFiltersCount = value.filter(f => f.enabled && f.field && f.value).length;

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon color="primary" />
          <Typography variant="h6">
            Filtros Simples
          </Typography>
          {activeFiltersCount > 0 && (
            <Chip 
              label={`${activeFiltersCount} ativo${activeFiltersCount > 1 ? 's' : ''}`}
              size="small" 
              color="primary" 
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Os filtros ajudam a refinar os dados do relatório">
            <IconButton size="small">
              <HelpIcon />
            </IconButton>
          </Tooltip>
          {value.length > 0 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<ClearIcon />}
              onClick={clearAllFilters}
            >
              Limpar Tudo
            </Button>
          )}
        </Box>
      </Box>

      {/* Lista de filtros */}
      {value.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {value.map((filter, index) => {
            const fieldInfo = getFieldInfo(filter.field);
            const availableOperators = fieldInfo ? operators[fieldInfo.type] || operators.text : operators.text;

            return (
              <Paper 
                key={filter.id} 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  mb: 1, 
                  bgcolor: filter.enabled ? 'background.paper' : 'grey.50',
                  opacity: filter.enabled ? 1 : 0.7 
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  {/* Toggle de ativação */}
                  <Grid item xs={1}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={filter.enabled}
                          onChange={(e) => updateFilter(filter.id, { enabled: e.target.checked })}
                          size="small"
                        />
                      }
                      label=""
                    />
                  </Grid>

                  {/* Campo */}
                  <Grid item xs={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Campo</InputLabel>
                      <Select
                        value={filter.field}
                        label="Campo"
                        onChange={(e) => updateFilter(filter.id, { 
                          field: e.target.value,
                          operator: '=',
                          value: ''
                        })}
                      >
                        {availableFilters.map(field => (
                          <MenuItem key={field.id} value={field.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span>{field.icon}</span>
                              {field.label}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Operador */}
                  <Grid item xs={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Operador</InputLabel>
                      <Select
                        value={filter.operator}
                        label="Operador"
                        onChange={(e) => updateFilter(filter.id, { operator: e.target.value })}
                        disabled={!filter.field}
                      >
                        {availableOperators.map(op => (
                          <MenuItem key={op.value} value={op.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span>{op.symbol}</span>
                              {op.label}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Valor */}
                  <Grid item xs={3}>
                    {filter.field ? renderFilterValue(filter) : (
                      <TextField
                        size="small"
                        disabled
                        placeholder="Selecione um campo primeiro"
                        fullWidth
                      />
                    )}
                  </Grid>

                  {/* Ações */}
                  <Grid item xs={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {fieldInfo && (
                        <Chip 
                          label={fieldInfo.unit || fieldInfo.type}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      )}
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeFilter(filter.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Botão para adicionar filtro */}
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={addFilter}
        fullWidth
        sx={{ 
          py: 1.5,
          borderStyle: 'dashed',
          '&:hover': {
            borderStyle: 'solid',
            bgcolor: 'primary.light',
            color: 'primary.contrastText'
          }
        }}
      >
        Adicionar Filtro
      </Button>

      {/* Preview dos filtros ativos */}
      {activeFiltersCount > 0 && (
        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2" color="primary">
              📋 Preview: {activeFiltersCount} filtros ativos
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {value
                .filter(f => f.enabled && f.field && f.value)
                .map((filter, index) => {
                  const fieldInfo = getFieldInfo(filter.field);
                  const operatorInfo = operators[fieldInfo?.type || 'text']?.find(op => op.value === filter.operator);
                  
                  return (
                    <Box key={filter.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {index > 0 && 'E '}
                      </Typography>
                      <Chip
                        icon={<span>{fieldInfo?.icon}</span>}
                        label={`${fieldInfo?.label} ${operatorInfo?.symbol} ${filter.value}${fieldInfo?.unit || ''}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  );
                })}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Dica de uso */}
      <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1, color: 'info.contrastText' }}>
        <Typography variant="caption">
          💡 <strong>Dica:</strong> Use filtros para refinar seus dados. 
          Por exemplo: &quot;Gasto Meta Ads &gt; 1000&quot; para ver apenas campanhas com gasto acima de R$ 1.000.
          Você pode usar o interruptor para ativar/desativar filtros sem deletá-los.
        </Typography>
      </Box>
    </Paper>
  );
};

export default SimpleFilters; 