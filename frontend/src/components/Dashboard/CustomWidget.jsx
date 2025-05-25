import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  AttachMoney as AttachMoneyIcon,
  Visibility as VisibilityIcon,
  PeopleAlt as PeopleAltIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  RemoveShoppingCart as AbandonedCartIcon,
  Pageview as PageViewIcon,
  PersonAdd as LeadIcon,
  CheckCircle as ConversionIcon
} from '@mui/icons-material';

const CustomWidget = ({ widget, data = {}, loading = false }) => {
  // 🔍 DEBUG: Logs para investigar o problema dos dados
  console.log('🔍 [CustomWidget] ===== DEBUG INÍCIO =====');
  console.log('🔍 [CustomWidget] Widget recebido:', widget);
  console.log('🔍 [CustomWidget] Widget.metrics:', widget.metrics);
  console.log('🔍 [CustomWidget] Data recebida:', data);
  console.log('🔍 [CustomWidget] Data.metaAds:', data.metaAds);
  console.log('🔍 [CustomWidget] Data.googleAnalytics:', data.googleAnalytics);
  console.log('🔍 [CustomWidget] Loading:', loading);
  console.log('🔍 [CustomWidget] ===== DEBUG FIM =====');

  // 🔧 CORREÇÃO: Validação robusta de dados
  const hasValidData = () => {
    if (!data || typeof data !== 'object') {
      console.log('❌ [CustomWidget] Data inválido ou não é objeto');
      return false;
    }
    
    // Verificar se tem pelo menos uma fonte de dados válida
    const hasMetaData = data.metaAds && typeof data.metaAds === 'object';
    const hasGAData = data.googleAnalytics && typeof data.googleAnalytics === 'object';
    
    console.log('🔍 [CustomWidget] hasMetaData:', hasMetaData);
    console.log('🔍 [CustomWidget] hasGAData:', hasGAData);
    
    return hasMetaData || hasGAData;
  };

  // 🔧 CORREÇÃO: Mensagem específica por tipo de problema
  const getEmptyStateMessage = () => {
    if (!data) return "Nenhum dado disponível";
    if (!data.metaAds && !data.googleAnalytics) return "Configure suas contas de integração";
    
    // Verificar se o widget precisa de Meta Ads mas não tem
    const needsMetaAds = widget.metrics && widget.metrics.some(m => {
      const metricId = getMetricId(m);
      return metricId.startsWith('meta_');
    });
    
    // Verificar se o widget precisa de GA mas não tem
    const needsGA = widget.metrics && widget.metrics.some(m => {
      const metricId = getMetricId(m);
      return metricId.startsWith('ga_');
    });
    
    if (needsMetaAds && (!data.metaAds || !data.metaAds.accounts || data.metaAds.accounts.length === 0)) {
      return "Configure uma conta Meta Ads";
    }
    
    if (needsGA && (!data.googleAnalytics || !data.googleAnalytics.accounts || data.googleAnalytics.accounts.length === 0)) {
      return "Configure uma conta Google Analytics";
    }
    
    return "Dados não encontrados para este período";
  };

  // 🔧 CORREÇÃO: Status de integração
  const getIntegrationStatus = () => {
    return {
      hasMetaAds: data?.metaAds?.accounts?.length > 0,
      hasGA: data?.googleAnalytics?.accounts?.length > 0,
      metaAccountsCount: data?.metaAds?.accounts?.length || 0,
      gaAccountsCount: data?.googleAnalytics?.accounts?.length || 0
    };
  };

  // Helper para gerar keys únicas e seguras
  const getMetricKey = (metric, index, prefix = '') => {
    if (typeof metric === 'string') {
      return `${prefix}${metric}`;
    } else if (typeof metric === 'object' && metric !== null) {
      // Se for objeto, tentar usar ID ou name, ou usar index como fallback
      const key = metric.name || metric.id || metric.type || `object-${index}`;
      return `${prefix}${key}`;
    }
    // Fallback para qualquer outro tipo
    return `${prefix}metric-${index}`;
  };

  // Formatadores
  const formatCurrency = (value) => {
    const numericValue = parseFloat(value) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numericValue);
  };

  const formatNumber = (value) => {
    const numericValue = parseFloat(value) || 0;
    return new Intl.NumberFormat('pt-BR').format(numericValue);
  };

  const formatPercentage = (value) => {
    const numericValue = parseFloat(value) || 0;
    return `${numericValue.toFixed(2)}%`;
  };

  // Helper para obter nome amigável da métrica
  const getMetricDisplayName = (metric) => {
    const metricId = getMetricId(metric);
    
    const metricNames = {
      // Meta Ads - Básicas
      'meta_spend': 'Gasto',
      'meta_impressions': 'Impressões',
      'meta_clicks': 'Cliques',
      'meta_ctr': 'CTR',
      'meta_cpm': 'CPM',
      'meta_reach': 'Alcance',
      
      // Meta Ads - Conversões
      'meta_purchases': 'Compras',
      'meta_purchase_value': 'Valor das Compras',
      'meta_add_to_cart': 'Carrinho',
      'meta_view_content': 'Visualizações',
      'meta_leads': 'Leads',
      'meta_initiate_checkout': 'Checkout',
      
      // Google Analytics
      'ga_sessions': 'Sessões',
      'ga_users': 'Usuários',
      'ga_pageviews': 'Visualizações de Página',
      'ga_bounce_rate': 'Taxa de Rejeição',
      
      // Combinadas
      'combined_roi': 'ROI',
      'combined_cost_per_session': 'Custo por Sessão',
      
      // Temporal
      'date_dimension': 'Data'
    };

    return metricNames[metricId] || metricId.replace('_', ' ').toUpperCase();
  };

  // Helper para extrair ID da métrica
  const getMetricId = (metric) => {
    if (typeof metric === 'string') {
      return metric;
    } else if (typeof metric === 'object' && metric !== null) {
      // Para métricas vindas do backend: {name: 'meta_spend', label: 'Meta Ads - Gasto', source: 'meta'}
      return metric.name || metric.id || metric.type || 'unknown';
    }
    return 'unknown';
  };

  // Extrair valor baseado na métrica
  const getMetricValue = (metric) => {
    const metricId = getMetricId(metric);
    
    console.log(`🔍 [CustomWidget] Buscando valor para métrica: ${metricId}`);
    console.log(`🔍 [CustomWidget] Métrica original:`, metric);
    
    let value = 0;
    
    switch (metricId) {
      case 'meta_spend':
        value = data.metaAds?.totalSpend || 0;
        console.log(`🔍 [CustomWidget] meta_spend - data.metaAds:`, data.metaAds);
        console.log(`🔍 [CustomWidget] meta_spend - totalSpend:`, data.metaAds?.totalSpend);
        break;
      case 'meta_impressions':
        value = data.metaAds?.totalImpressions || 0;
        console.log(`🔍 [CustomWidget] meta_impressions - totalImpressions:`, data.metaAds?.totalImpressions);
        break;
      case 'meta_clicks':
        value = data.metaAds?.totalClicks || 0;
        console.log(`🔍 [CustomWidget] meta_clicks - totalClicks:`, data.metaAds?.totalClicks);
        break;
      case 'meta_ctr':
        value = data.metaAds?.avgCTR || 0;
        console.log(`🔍 [CustomWidget] meta_ctr - avgCTR:`, data.metaAds?.avgCTR);
        break;
      case 'meta_cpm':
        value = data.metaAds?.avgCPM || 0;
        console.log(`🔍 [CustomWidget] meta_cpm - avgCPM:`, data.metaAds?.avgCPM);
        break;
      case 'meta_reach':
        value = data.metaAds?.totalReach || 0;
        console.log(`🔍 [CustomWidget] meta_reach - totalReach:`, data.metaAds?.totalReach);
        break;
      // Novas métricas de conversão
      case 'meta_purchases':
        value = data.metaAds?.totalPurchases || 0;
        console.log(`🔍 [CustomWidget] meta_purchases - totalPurchases:`, data.metaAds?.totalPurchases);
        break;
      case 'meta_purchase_value':
        value = data.metaAds?.totalPurchaseValue || 0;
        console.log(`🔍 [CustomWidget] meta_purchase_value - totalPurchaseValue:`, data.metaAds?.totalPurchaseValue);
        break;
      case 'meta_add_to_cart':
        value = data.metaAds?.totalAddToCart || 0;
        console.log(`🔍 [CustomWidget] meta_add_to_cart - totalAddToCart:`, data.metaAds?.totalAddToCart);
        break;
      case 'meta_view_content':
        value = data.metaAds?.totalViewContent || 0;
        console.log(`🔍 [CustomWidget] meta_view_content - totalViewContent:`, data.metaAds?.totalViewContent);
        break;
      case 'meta_leads':
        value = data.metaAds?.totalLeads || 0;
        console.log(`🔍 [CustomWidget] meta_leads - totalLeads:`, data.metaAds?.totalLeads);
        break;
      case 'meta_initiate_checkout':
        value = data.metaAds?.totalInitiateCheckout || 0;
        console.log(`🔍 [CustomWidget] meta_initiate_checkout - totalInitiateCheckout:`, data.metaAds?.totalInitiateCheckout);
        break;
      case 'ga_sessions':
        value = data.googleAnalytics?.totalSessions || 0;
        console.log(`🔍 [CustomWidget] ga_sessions - data.googleAnalytics:`, data.googleAnalytics);
        console.log(`🔍 [CustomWidget] ga_sessions - totalSessions:`, data.googleAnalytics?.totalSessions);
        break;
      case 'ga_users':
        value = data.googleAnalytics?.totalUsers || 0;
        console.log(`🔍 [CustomWidget] ga_users - totalUsers:`, data.googleAnalytics?.totalUsers);
        break;
      case 'ga_pageviews':
        value = data.googleAnalytics?.totalPageviews || 0;
        console.log(`🔍 [CustomWidget] ga_pageviews - totalPageviews:`, data.googleAnalytics?.totalPageviews);
        break;
      case 'combined_roi':
        value = calculateROI();
        console.log(`🔍 [CustomWidget] combined_roi - calculado:`, value);
        break;
      case 'combined_cost_per_session':
        value = calculateCostPerSession();
        console.log(`🔍 [CustomWidget] combined_cost_per_session - calculado:`, value);
        break;
      default:
        console.log(`🔍 [CustomWidget] Métrica não reconhecida: ${metricId}`);
        value = 0;
    }
    
    console.log(`🔍 [CustomWidget] Valor final para ${metricId}: ${value}`);
    return value;
  };

  // Calcular ROI
  const calculateROI = () => {
    const spend = data.metaAds?.totalSpend || 0;
    const sessions = data.googleAnalytics?.totalSessions || 0;
    if (spend === 0 || sessions === 0) return 0;
    // ROI simplificado: (sessions * valor estimado por sessão - spend) / spend * 100
    const estimatedValue = sessions * 10; // R$ 10 por sessão estimado
    return ((estimatedValue - spend) / spend * 100);
  };

  // Calcular custo por sessão
  const calculateCostPerSession = () => {
    const spend = data.metaAds?.totalSpend || 0;
    const sessions = data.googleAnalytics?.totalSessions || 0;
    return sessions > 0 ? spend / sessions : 0;
  };

  // Obter ícone baseado na métrica
  const getMetricIcon = (metric) => {
    const metricId = getMetricId(metric);
    const iconProps = { fontSize: 'large' };
    
    switch (metricId) {
      case 'meta_spend':
      case 'meta_cpm':
      case 'combined_cost_per_session':
        return <AttachMoneyIcon color="primary" {...iconProps} />;
      case 'meta_impressions':
      case 'meta_reach':
        return <VisibilityIcon color="secondary" {...iconProps} />;
      case 'ga_sessions':
      case 'ga_users':
      case 'ga_pageviews':
        return <PeopleAltIcon color="success" {...iconProps} />;
      case 'meta_ctr':
      case 'combined_roi':
        return <TrendingUpIcon color="info" {...iconProps} />;
      case 'meta_purchases':
        return <ShoppingCartIcon color="primary" {...iconProps} />;
      case 'meta_purchase_value':
        return <ShoppingCartIcon color="primary" {...iconProps} />;
      case 'meta_add_to_cart':
        return <ShoppingCartIcon color="primary" {...iconProps} />;
      case 'meta_view_content':
        return <PageViewIcon color="primary" {...iconProps} />;
      case 'meta_leads':
        return <LeadIcon color="primary" {...iconProps} />;
      case 'meta_initiate_checkout':
        return <ConversionIcon color="primary" {...iconProps} />;
      default:
        return <TrendingUpIcon color="primary" {...iconProps} />;
    }
  };

  // Formatar valor baseado no tipo
  const formatMetricValue = (metric, value) => {
    const metricId = getMetricId(metric);
    
    const metricTypes = {
      'meta_spend': 'currency',
      'meta_impressions': 'number',
      'meta_clicks': 'number',
      'meta_ctr': 'percentage',
      'meta_cpm': 'currency',
      'meta_reach': 'number',
      // Novas métricas de conversão
      'meta_purchases': 'number',
      'meta_purchase_value': 'currency',
      'meta_add_to_cart': 'number',
      'meta_view_content': 'number',
      'meta_leads': 'number',
      'meta_initiate_checkout': 'number',
      'ga_sessions': 'number',
      'ga_users': 'number',
      'ga_pageviews': 'number',
      'combined_roi': 'percentage',
      'combined_cost_per_session': 'currency'
    };

    const type = metricTypes[metricId] || 'number';
    
    switch (type) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      case 'number':
      default:
        return formatNumber(value);
    }
  };

  // Preparar dados para gráfico
  const prepareChartData = () => {
    console.log('🔍 [CustomWidget] prepareChartData() chamado');
    console.log('🔍 [CustomWidget] widget.metrics:', widget.metrics);
    console.log('🔍 [CustomWidget] widget.type:', widget.type);
    console.log('🔍 [CustomWidget] widget.isTemporalChart:', widget.isTemporalChart);
    
    if (!widget.metrics || widget.metrics.length === 0) {
      console.log('❌ [CustomWidget] Nenhuma métrica definida');
      return [];
    }

    if (widget.type === 'chart') {
      // 🔧 NOVO: Verificar se é gráfico temporal
      const isTemporalChart = widget.isTemporalChart || widget.metrics.some(metric => {
        const metricId = getMetricId(metric);
        return metricId === 'date_dimension';
      });
      
      console.log('🔍 [CustomWidget] isTemporalChart detectado:', isTemporalChart);
      
      if (isTemporalChart) {
        return prepareTemporalChartData();
      } else {
        return prepareStandardChartData();
      }
    }

    return [];
  };

  // 🔧 NOVO: Preparar dados para gráficos temporais
  const prepareTemporalChartData = () => {
    console.log('📅 [CustomWidget] prepareTemporalChartData() chamado');
    
    const chartData = [];
    const temporalData = data.temporal;
    
    if (!temporalData) {
      console.log('❌ [CustomWidget] Nenhum dado temporal disponível');
      return [];
    }
    
    // Combinar dados temporais do Meta Ads e GA
    const allTemporalData = [];
    
    // Processar dados temporais do Meta Ads
    if (temporalData.metaAds && temporalData.metaAds.length > 0) {
      console.log('📅 [CustomWidget] Processando dados temporais Meta Ads:', temporalData.metaAds.length, 'registros');
      
      temporalData.metaAds.forEach(dayData => {
        const existingEntry = allTemporalData.find(entry => entry.date === dayData.date);
        
        if (existingEntry) {
          // Somar valores do mesmo dia
          existingEntry.spend = (existingEntry.spend || 0) + dayData.spend;
          existingEntry.impressions = (existingEntry.impressions || 0) + dayData.impressions;
          existingEntry.clicks = (existingEntry.clicks || 0) + dayData.clicks;
          existingEntry.purchases = (existingEntry.purchases || 0) + dayData.purchases;
          existingEntry.leads = (existingEntry.leads || 0) + dayData.leads;
          existingEntry.purchaseValue = (existingEntry.purchaseValue || 0) + dayData.purchaseValue;
          existingEntry.addToCart = (existingEntry.addToCart || 0) + dayData.addToCart;
          existingEntry.viewContent = (existingEntry.viewContent || 0) + dayData.viewContent;
          existingEntry.initiateCheckout = (existingEntry.initiateCheckout || 0) + dayData.initiateCheckout;
        } else {
          allTemporalData.push({
            date: dayData.date,
            dateDisplay: dayData.dateDisplay || new Date(dayData.date).toLocaleDateString('pt-BR'),
            name: dayData.dateDisplay || new Date(dayData.date).toLocaleDateString('pt-BR'),
            spend: dayData.spend || 0,
            impressions: dayData.impressions || 0,
            clicks: dayData.clicks || 0,
            purchases: dayData.purchases || 0,
            leads: dayData.leads || 0,
            purchaseValue: dayData.purchaseValue || 0,
            addToCart: dayData.addToCart || 0,
            viewContent: dayData.viewContent || 0,
            initiateCheckout: dayData.initiateCheckout || 0,
            // Placeholder para dados GA (serão adicionados se disponíveis)
            sessions: 0,
            users: 0,
            pageviews: 0
          });
        }
      });
    }
    
    // Processar dados temporais do Google Analytics (se implementado no futuro)
    if (temporalData.googleAnalytics && temporalData.googleAnalytics.length > 0) {
      console.log('📅 [CustomWidget] Processando dados temporais GA:', temporalData.googleAnalytics.length, 'registros');
      
      temporalData.googleAnalytics.forEach(dayData => {
        const existingEntry = allTemporalData.find(entry => entry.date === dayData.date);
        
        if (existingEntry) {
          existingEntry.sessions = (existingEntry.sessions || 0) + dayData.sessions;
          existingEntry.users = (existingEntry.users || 0) + dayData.users;
          existingEntry.pageviews = (existingEntry.pageviews || 0) + dayData.pageviews;
        } else {
          allTemporalData.push({
            date: dayData.date,
            dateDisplay: dayData.dateDisplay || new Date(dayData.date).toLocaleDateString('pt-BR'),
            name: dayData.dateDisplay || new Date(dayData.date).toLocaleDateString('pt-BR'),
            sessions: dayData.sessions || 0,
            users: dayData.users || 0,
            pageviews: dayData.pageviews || 0,
            // Placeholder para dados Meta
            spend: 0,
            impressions: 0,
            clicks: 0,
            purchases: 0,
            leads: 0
          });
        }
      });
    }
    
    // Ordenar por data
    allTemporalData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    console.log('📅 [CustomWidget] Dados temporais preparados:', allTemporalData.length, 'dias');
    console.log('📅 [CustomWidget] Amostra dos dados:', allTemporalData.slice(0, 3));
    
    return allTemporalData;
  };

  // 🔧 RENOMEADO: Preparar dados para gráficos padrão (não temporais)
  const prepareStandardChartData = () => {
    console.log('🔍 [CustomWidget] prepareStandardChartData() chamado');
    console.log('🔍 [CustomWidget] data.metaAds?.accounts:', data.metaAds?.accounts);
    console.log('🔍 [CustomWidget] data.googleAnalytics?.accounts:', data.googleAnalytics?.accounts);
    
    const chartData = [];

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

    // Processar contas Meta Ads apenas se houver métricas Meta
    if (hasMetaMetrics && data.metaAds?.accounts && data.metaAds.accounts.length > 0) {
      console.log('🔍 [CustomWidget] Processando contas Meta Ads...');
      data.metaAds.accounts.forEach(account => {
        const item = { name: account.accountName || 'Conta Meta' };
        widget.metrics.forEach(metric => {
          const metricId = getMetricId(metric);
          console.log(`🔍 [CustomWidget] Processando métrica ${metricId} para conta ${account.accountName}`);
          
          // Processar apenas métricas do Meta Ads
          if (metricId.startsWith('meta_')) {
            switch (metricId) {
              case 'meta_spend':
                item.spend = account.spend || 0;
                break;
              case 'meta_impressions':
                item.impressions = account.impressions || 0;
                break;
              case 'meta_clicks':
                item.clicks = account.clicks || 0;
                break;
              case 'meta_ctr':
                item.ctr = account.ctr || 0;
                break;
              case 'meta_cpm':
                item.cpm = account.cpm || 0;
                break;
              case 'meta_reach':
                item.reach = account.reach || 0;
                break;
              case 'meta_purchases':
                item.purchases = account.purchases || 0;
                break;
              case 'meta_purchase_value':
                item.purchaseValue = account.purchaseValue || 0;
                break;
              case 'meta_add_to_cart':
                item.addToCart = account.addToCart || 0;
                break;
              case 'meta_view_content':
                item.viewContent = account.viewContent || 0;
                break;
              case 'meta_leads':
                item.leads = account.leads || 0;
                break;
              case 'meta_initiate_checkout':
                item.initiateCheckout = account.initiateCheckout || 0;
                break;
            }
          }
        });
        chartData.push(item);
      });
    }

    // Processar contas Google Analytics apenas se houver métricas GA
    if (hasGAMetrics && data.googleAnalytics?.accounts && data.googleAnalytics.accounts.length > 0) {
      console.log('🔍 [CustomWidget] Processando contas Google Analytics...');
      data.googleAnalytics.accounts.forEach(account => {
        const item = { name: account.propertyName || 'Propriedade GA' };
        widget.metrics.forEach(metric => {
          const metricId = getMetricId(metric);
          console.log(`🔍 [CustomWidget] Processando métrica ${metricId} para propriedade ${account.propertyName}`);
          
          // Processar apenas métricas do Google Analytics
          if (metricId.startsWith('ga_')) {
            switch (metricId) {
              case 'ga_sessions':
                item.sessions = account.sessions || 0;
                break;
              case 'ga_users':
                item.users = account.users || 0;
                break;
              case 'ga_pageviews':
                item.pageviews = account.pageviews || 0;
                break;
            }
          }
        });
        chartData.push(item);
      });
    }

    // 🔧 CORREÇÃO: Se não há contas mas há dados agregados, criar entrada única
    if (chartData.length === 0) {
      console.log('🔍 [CustomWidget] Nenhuma conta individual, criando dados agregados...');
      const aggregatedItem = { name: 'Total' };
      
      widget.metrics.forEach(metric => {
        const metricId = getMetricId(metric);
        const value = getMetricValue(metric);
        console.log(`🔍 [CustomWidget] Valor agregado para ${metricId}: ${value}`);
        
        switch (metricId) {
          case 'meta_spend':
            aggregatedItem.spend = value;
            break;
          case 'meta_impressions':
            aggregatedItem.impressions = value;
            break;
          case 'meta_clicks':
            aggregatedItem.clicks = value;
            break;
          case 'meta_ctr':
            aggregatedItem.ctr = value;
            break;
          case 'meta_cpm':
            aggregatedItem.cpm = value;
            break;
          case 'meta_reach':
            aggregatedItem.reach = value;
            break;
          case 'ga_sessions':
            aggregatedItem.sessions = value;
            break;
          case 'ga_users':
            aggregatedItem.users = value;
            break;
          case 'ga_pageviews':
            aggregatedItem.pageviews = value;
            break;
          case 'meta_purchases':
            aggregatedItem.purchases = value;
            break;
          case 'meta_purchase_value':
            aggregatedItem.purchaseValue = value;
            break;
          case 'meta_add_to_cart':
            aggregatedItem.addToCart = value;
            break;
          case 'meta_view_content':
            aggregatedItem.viewContent = value;
            break;
          case 'meta_leads':
            aggregatedItem.leads = value;
            break;
          case 'meta_initiate_checkout':
            aggregatedItem.initiateCheckout = value;
            break;
        }
      });
      
      chartData.push(aggregatedItem);
    }

    console.log('🔍 [CustomWidget] Dados do gráfico preparados:', chartData);
    return chartData;
  };

  // Renderizar widget tipo gráfico
  const renderChart = () => {
    console.log('🔍 [CustomWidget] renderChart() chamado');
    console.log('🔍 [CustomWidget] widget.chartType:', widget.chartType);
    
    const chartData = prepareChartData();
    console.log('🔍 [CustomWidget] chartData obtido:', chartData);
    
    if (chartData.length === 0) {
      console.log('❌ [CustomWidget] Nenhum dado para o gráfico');
      return (
        <Box display="flex" alignItems="center" justifyContent="center" height={200}>
          <Typography color="text.secondary">
            {getEmptyStateMessage()}
          </Typography>
        </Box>
      );
    }

    const props = {
      data: chartData,
      width: '100%',
      height: 300
    };

    // 🔧 CORREÇÃO: Definir chartType padrão se não especificado
    const chartType = widget.chartType || 'bar';
    console.log('🔍 [CustomWidget] Tipo de gráfico a ser renderizado:', chartType);

    switch (chartType) {
      case 'bar':
        console.log('🔍 [CustomWidget] Renderizando gráfico de barras');
        return (
          <ResponsiveContainer {...props}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              {widget.metrics.map((metric, index) => {
                const colors = ['#1976d2', '#2e7d32', '#d32f2f', '#ed6c02', '#9c27b0'];
                const metricId = getMetricId(metric);
                const dataKey = metricId.split('_')[1]; // Remove prefixo meta_/ga_
                console.log(`🔍 [CustomWidget] Adicionando barra para métrica ${metricId}, dataKey: ${dataKey}`);
                return (
                  <Bar 
                    key={getMetricKey(metric, index)}
                    dataKey={dataKey}
                    fill={widget.color || colors[index % colors.length]}
                    name={getMetricDisplayName(metric)}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        console.log('🔍 [CustomWidget] Renderizando gráfico de linhas');
        return (
          <ResponsiveContainer {...props}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              {widget.metrics.map((metric, index) => {
                const colors = ['#1976d2', '#2e7d32', '#d32f2f', '#ed6c02', '#9c27b0'];
                const metricId = getMetricId(metric);
                const dataKey = metricId.split('_')[1];
                return (
                  <Line 
                    key={getMetricKey(metric, index)}
                    type="monotone"
                    dataKey={dataKey}
                    stroke={widget.color || colors[index % colors.length]}
                    name={getMetricDisplayName(metric)}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        console.log('🔍 [CustomWidget] Renderizando gráfico de área');
        return (
          <ResponsiveContainer {...props}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              {widget.metrics.map((metric, index) => {
                const colors = ['#1976d2', '#2e7d32', '#d32f2f', '#ed6c02', '#9c27b0'];
                const metricId = getMetricId(metric);
                const dataKey = metricId.split('_')[1];
                return (
                  <Area 
                    key={getMetricKey(metric, index)}
                    type="monotone"
                    dataKey={dataKey}
                    fill={widget.color || colors[index % colors.length]}
                    name={getMetricDisplayName(metric)}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        console.log('🔍 [CustomWidget] Renderizando gráfico de pizza');
        const pieData = widget.metrics.map((metric, index) => ({
          name: getMetricDisplayName(metric),
          value: getMetricValue(metric),
          originalMetric: metric,
          index: index
        }));
        
        return (
          <ResponsiveContainer {...props}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill={widget.color || '#1976d2'}
                dataKey="value"
              >
                {pieData.map((entry, index) => {
                  const colors = ['#1976d2', '#2e7d32', '#d32f2f', '#ed6c02', '#9c27b0'];
                  return <Cell key={getMetricKey(entry.originalMetric, index)} fill={colors[index % colors.length]} />;
                })}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        console.log('🔍 [CustomWidget] Tipo de gráfico não reconhecido, usando barra como padrão');
        return (
          <ResponsiveContainer {...props}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              {widget.metrics.map((metric, index) => {
                const colors = ['#1976d2', '#2e7d32', '#d32f2f', '#ed6c02', '#9c27b0'];
                const metricId = getMetricId(metric);
                const dataKey = metricId.split('_')[1];
                return (
                  <Bar 
                    key={getMetricKey(metric, index)}
                    dataKey={dataKey}
                    fill={widget.color || colors[index % colors.length]}
                    name={getMetricDisplayName(metric)}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  // 🔧 CORREÇÃO: Implementar widget tipo tabela funcional
  const renderTable = () => {
    console.log('🔍 [CustomWidget] renderTable() chamado');
    console.log('🔍 [CustomWidget] widget.metrics:', widget.metrics);
    
    if (!widget.metrics || widget.metrics.length === 0) {
      return (
        <Box display="flex" alignItems="center" justifyContent="center" height={200}>
          <Typography color="text.secondary">
            Nenhuma métrica configurada
          </Typography>
        </Box>
      );
    }

    // 🔧 CORREÇÃO: Verificar quais fontes de dados são necessárias
    const hasMetaMetrics = widget.metrics.some(metric => {
      const metricId = getMetricId(metric);
      return metricId.startsWith('meta_');
    });
    
    const hasGAMetrics = widget.metrics.some(metric => {
      const metricId = getMetricId(metric);
      return metricId.startsWith('ga_');
    });

    console.log('🔍 [CustomWidget] [TABLE] hasMetaMetrics:', hasMetaMetrics);
    console.log('🔍 [CustomWidget] [TABLE] hasGAMetrics:', hasGAMetrics);

    // Preparar dados da tabela
    const tableData = [];
    
    // Adicionar dados de Meta Ads apenas se houver métricas Meta
    if (hasMetaMetrics && data.metaAds?.accounts && data.metaAds.accounts.length > 0) {
      console.log('🔍 [CustomWidget] [TABLE] Processando contas Meta Ads...');
      data.metaAds.accounts.forEach(account => {
        const row = {
          fonte: 'Meta Ads',
          conta: account.accountName,
          gasto: account.spend || 0,
          impressoes: account.impressions || 0,
          cliques: account.clicks || 0,
          ctr: account.ctr || 0,
          cpm: account.cpm || 0,
          alcance: account.reach || 0
        };
        tableData.push(row);
      });
    }

    // Adicionar dados de Google Analytics apenas se houver métricas GA
    if (hasGAMetrics && data.googleAnalytics?.accounts && data.googleAnalytics.accounts.length > 0) {
      console.log('🔍 [CustomWidget] [TABLE] Processando contas Google Analytics...');
      data.googleAnalytics.accounts.forEach(account => {
        const row = {
          fonte: 'Google Analytics',
          conta: account.propertyName,
          sessoes: account.sessions || 0,
          usuarios: account.users || 0,
          pageviews: account.pageviews || 0,
          duracao: account.avgSessionDuration || 0,
          bounce: account.bounceRate || 0
        };
        tableData.push(row);
      });
    }

    // Se não há contas individuais, criar linha com totais (apenas para as fontes necessárias)
    if (tableData.length === 0) {
      console.log('🔍 [CustomWidget] [TABLE] Criando linha de totais...');
      const row = {
        fonte: 'Resumo Geral',
        conta: 'Totais'
      };

      // Adicionar totais apenas se as métricas correspondentes estão selecionadas
      if (hasMetaMetrics) {
        row.gasto = data.metaAds?.totalSpend || 0;
        row.impressoes = data.metaAds?.totalImpressions || 0;
        row.cliques = data.metaAds?.totalClicks || 0;
        row.ctr = data.metaAds?.avgCTR || 0;
        row.cpm = data.metaAds?.avgCPM || 0;
        row.alcance = data.metaAds?.totalReach || 0;
      }

      if (hasGAMetrics) {
        row.sessoes = data.googleAnalytics?.totalSessions || 0;
        row.usuarios = data.googleAnalytics?.totalUsers || 0;
        row.pageviews = data.googleAnalytics?.totalPageviews || 0;
        row.duracao = data.googleAnalytics?.avgSessionDuration || 0;
        row.bounce = data.googleAnalytics?.bounceRate || 0;
      }

      tableData.push(row);
    }

    console.log('🔍 [CustomWidget] [TABLE] Dados da tabela:', tableData);

    return (
      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fonte</TableCell>
                <TableCell>Conta</TableCell>
                {/* Colunas específicas baseadas nas métricas selecionadas */}
                {widget.metrics.map(metric => {
                  const metricId = getMetricId(metric);
                  let columnLabel = '';
                  switch (metricId) {
                    case 'meta_spend':
                      columnLabel = 'Gasto';
                      break;
                    case 'meta_impressions':
                      columnLabel = 'Impressões';
                      break;
                    case 'meta_clicks':
                      columnLabel = 'Cliques';
                      break;
                    case 'meta_ctr':
                      columnLabel = 'CTR (%)';
                      break;
                    case 'meta_cpm':
                      columnLabel = 'CPM';
                      break;
                    case 'meta_reach':
                      columnLabel = 'Alcance';
                      break;
                    case 'meta_purchases':
                      columnLabel = 'Compras';
                      break;
                    case 'meta_purchase_value':
                      columnLabel = 'Valor das Compras';
                      break;
                    case 'meta_add_to_cart':
                      columnLabel = 'Carrinho';
                      break;
                    case 'meta_view_content':
                      columnLabel = 'Visualizações';
                      break;
                    case 'meta_leads':
                      columnLabel = 'Leads';
                      break;
                    case 'meta_initiate_checkout':
                      columnLabel = 'Checkout';
                      break;
                    case 'ga_sessions':
                      columnLabel = 'Sessões';
                      break;
                    case 'ga_users':
                      columnLabel = 'Usuários';
                      break;
                    case 'ga_pageviews':
                      columnLabel = 'Visualizações';
                      break;
                    case 'ga_bounce_rate':
                      columnLabel = 'Taxa de Rejeição';
                      break;
                    case 'combined_roi':
                      columnLabel = 'ROI';
                      break;
                    case 'combined_cost_per_session':
                      columnLabel = 'Custo por Sessão';
                      break;
                    default:
                      columnLabel = getMetricDisplayName(metric);
                  }
                  
                  return <TableCell key={getMetricKey(metric, widget.metrics.indexOf(metric))} align="right">{columnLabel}</TableCell>;
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData.map((row, index) => (
                <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                  <TableCell>{row.fonte}</TableCell>
                  <TableCell>{row.conta}</TableCell>
                  {/* Valores específicos baseados nas métricas selecionadas */}
                  {widget.metrics.map(metric => {
                    const metricId = getMetricId(metric);
                    let value = '';
                    
                    switch (metricId) {
                      case 'meta_spend':
                        value = formatCurrency(row.gasto || 0);
                        break;
                      case 'meta_impressions':
                        value = formatNumber(row.impressoes || 0);
                        break;
                      case 'meta_clicks':
                        value = formatNumber(row.cliques || 0);
                        break;
                      case 'meta_ctr':
                        value = formatPercentage(row.ctr || 0);
                        break;
                      case 'meta_cpm':
                        value = formatCurrency(row.cpm || 0);
                        break;
                      case 'meta_reach':
                        value = formatNumber(row.alcance || 0);
                        break;
                      case 'ga_sessions':
                        value = formatNumber(row.sessoes || 0);
                        break;
                      case 'ga_users':
                        value = formatNumber(row.usuarios || 0);
                        break;
                      case 'ga_pageviews':
                        value = formatNumber(row.pageviews || 0);
                        break;
                      default:
                        value = '-';
                    }
                    
                    return <TableCell key={getMetricKey(metric, widget.metrics.indexOf(metric))} align="right">{value}</TableCell>;
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {tableData.length === 0 && (
          <Box display="flex" alignItems="center" justifyContent="center" height={200}>
            <Typography color="text.secondary">
              {getEmptyStateMessage()}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  // Renderizar widget tipo card
  const renderCard = () => {
    console.log('🔍 [CustomWidget] renderCard() chamado!');
    console.log('🔍 [CustomWidget] widget.metrics:', widget.metrics);
    
    const primaryMetric = widget.metrics[0];
    console.log('🔍 [CustomWidget] primaryMetric:', primaryMetric);
    
    const value = getMetricValue(primaryMetric);
    console.log('🔍 [CustomWidget] value obtido:', value);
    
    const icon = getMetricIcon(primaryMetric);

    return (
      <Box display="flex" alignItems="center" gap={2}>
        {icon}
        <Box>
          <Typography variant="h4" color={widget.color || 'primary'}>
            {formatMetricValue(primaryMetric, value)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {widget.title}
          </Typography>
          {widget.metrics.length > 1 && (
            <Box mt={1}>
              {widget.metrics.slice(1).map((metric, index) => (
                <Chip
                  key={getMetricKey(metric, index)}
                  label={`${formatMetricValue(metric, getMetricValue(metric))}`}
                  size="small"
                  variant="outlined"
                  sx={{ mr: 0.5 }}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  // Determinar tamanho do grid
  const getGridSize = () => {
    switch (widget.size) {
      case 'small':
        return { xs: 12, sm: 6, md: 4 };
      case 'medium':
        return { xs: 12, sm: 6, md: 6 };
      case 'large':
        return { xs: 12 };
      default:
        return { xs: 12, sm: 6, md: 6 };
    }
  };

  // 🔧 CORREÇÃO: Condição de loading melhorada
  if (loading) {
    return (
      <Card sx={{ minHeight: widget.type === 'card' ? 120 : 300 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" height="100%">
            <CircularProgress size={40} />
            <Typography color="text.secondary" sx={{ ml: 2 }}>Carregando dados...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // 🔧 CORREÇÃO: Verificar se há dados válidos
  if (!hasValidData()) {
    const integrationStatus = getIntegrationStatus();
    
    return (
      <Card sx={{ minHeight: widget.type === 'card' ? 120 : 300, border: 1, borderColor: 'warning.main' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color={widget.color || 'primary'}>
            {widget.title}
          </Typography>
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
            <Typography color="warning.main" variant="h6" gutterBottom>
              ⚠️ {getEmptyStateMessage()}
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Status: Meta Ads ({integrationStatus.metaAccountsCount}), GA ({integrationStatus.gaAccountsCount})
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', border: widget.comparison ? 2 : 0, borderColor: widget.color }}>
      <CardContent>
        <Typography variant="h6" gutterBottom color={widget.color || 'primary'}>
          {widget.title}
        </Typography>
        
        {widget.comparison && (
          <Chip 
            label={`Comparação: ${widget.comparisonPeriod}`}
            size="small"
            color="primary"
            sx={{ mb: 2 }}
          />
        )}

        {(() => {
          console.log(`🔍 [CustomWidget] Renderizando tipo: ${widget.type}`);
          
          if (widget.type === 'card') {
            console.log('🔍 [CustomWidget] Chamando renderCard()');
            return renderCard();
          } else if (widget.type === 'chart') {
            console.log('🔍 [CustomWidget] Chamando renderChart()');
            return renderChart();
          } else if (widget.type === 'table') {
            console.log('🔍 [CustomWidget] Chamando renderTable()');
            return renderTable();
          } else {
            console.log(`❌ [CustomWidget] Tipo não reconhecido: ${widget.type}`);
            return <Typography color="error">Tipo de widget não reconhecido: {widget.type}</Typography>;
          }
        })()}
      </CardContent>
    </Card>
  );
};

export default CustomWidget; 