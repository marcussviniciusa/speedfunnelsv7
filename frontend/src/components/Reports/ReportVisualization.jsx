import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
  Button,
  Tabs,
  Tab,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  GetApp as ExportIcon,
  Share as ShareIcon,
  TableChart as TableIcon,
  BarChart as ChartIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

const ReportVisualization = ({ data, config, loading }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!data) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Nenhum dado para exibir
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Execute um relatório para ver os resultados aqui.
        </Typography>
      </Box>
    );
  }

  // Cores para gráficos
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FFBB28', '#FF8042'];

  // Formatar valores monetários
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Formatar números
  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
  };

  // Preparar dados para gráficos
  const prepareMetaChartData = () => {
    if (!data.metaAds?.campaigns) return [];
    
    return data.metaAds.campaigns.map(campaign => ({
      name: campaign.campaignName?.substring(0, 20) + '...' || 'Sem nome',
      gasto: campaign.spend || 0,
      impressoes: campaign.impressions || 0,
      cliques: campaign.clicks || 0,
      ctr: campaign.ctr || 0,
      cpm: campaign.cpm || 0
    }));
  };

  const prepareGAChartData = () => {
    if (!data.googleAnalytics?.segments) return [];
    
    return data.googleAnalytics.segments.map((segment, index) => ({
      name: segment.dimensions?.join(' - ') || `Segmento ${index + 1}`,
      sessoes: segment.sessions || 0,
      usuarios: segment.users || 0,
      pageviews: segment.pageviews || 0,
      duracaoSessao: segment.avgSessionDuration || 0,
      taxaRejeicao: segment.bounceRate || 0
    }));
  };

  // Métricas resumidas
  const renderSummaryCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Gasto Total
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(data.summary?.totalSpend)}
                </Typography>
              </Box>
              <TrendingUpIcon color="primary" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Total de Sessões
                </Typography>
                <Typography variant="h6">
                  {formatNumber(data.summary?.totalSessions)}
                </Typography>
              </Box>
              <TrendingUpIcon color="success" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Campanhas Ativas
                </Typography>
                <Typography variant="h6">
                  {data.summary?.activeCampaigns || 0}
                </Typography>
              </Box>
              <BarChart color="secondary" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  ROI
                </Typography>
                <Typography variant="h6" color={data.summary?.roi >= 0 ? 'success.main' : 'error.main'}>
                  {data.summary?.roi?.toFixed(1) || 0}%
                </Typography>
              </Box>
              {data.summary?.roi >= 0 ? 
                <TrendingUpIcon color="success" /> : 
                <TrendingDownIcon color="error" />
              }
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Renderizar gráficos
  const renderCharts = () => (
    <Grid container spacing={3}>
      {/* Gráfico Meta Ads */}
      {data.metaAds?.campaigns?.length > 0 && (
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Performance das Campanhas Meta Ads
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={prepareMetaChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip formatter={(value, name) => [
                  name === 'gasto' ? formatCurrency(value) : formatNumber(value),
                  name
                ]} />
                <Legend />
                <Bar dataKey="gasto" fill={colors[0]} name="Gasto" />
                <Bar dataKey="cliques" fill={colors[1]} name="Cliques" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      )}

      {/* Gráfico Google Analytics */}
      {data.googleAnalytics?.segments?.length > 0 && (
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Sessões por Segmento - Google Analytics
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={prepareGAChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip formatter={(value) => [formatNumber(value), 'Sessões']} />
                <Area 
                  type="monotone" 
                  dataKey="sessoes" 
                  stroke={colors[2]} 
                  fill={colors[2]} 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      )}

      {/* Gráfico CTR vs CPM */}
      {data.metaAds?.campaigns?.length > 0 && (
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              CTR vs CPM por Campanha
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={prepareMetaChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip />
                <Legend />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="ctr" 
                  stroke={colors[3]} 
                  name="CTR (%)" 
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="cpm" 
                  stroke={colors[4]} 
                  name="CPM (R$)" 
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      )}
    </Grid>
  );

  // Renderizar tabelas
  const renderTables = () => (
    <Box>
      {/* Tabela Meta Ads */}
      {data.metaAds?.campaigns?.length > 0 && (
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">
              Detalhes das Campanhas Meta Ads
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Campanha</TableCell>
                  <TableCell align="right">Gasto</TableCell>
                  <TableCell align="right">Impressões</TableCell>
                  <TableCell align="right">Cliques</TableCell>
                  <TableCell align="right">CTR</TableCell>
                  <TableCell align="right">CPM</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.metaAds.campaigns.map((campaign, index) => (
                  <TableRow key={index}>
                    <TableCell>{campaign.campaignName || 'Sem nome'}</TableCell>
                    <TableCell align="right">{formatCurrency(campaign.spend)}</TableCell>
                    <TableCell align="right">{formatNumber(campaign.impressions)}</TableCell>
                    <TableCell align="right">{formatNumber(campaign.clicks)}</TableCell>
                    <TableCell align="right">{(campaign.ctr || 0).toFixed(2)}%</TableCell>
                    <TableCell align="right">{formatCurrency(campaign.cpm)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Tabela Google Analytics */}
      {data.googleAnalytics?.segments?.length > 0 && (
        <Paper>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">
              Detalhes dos Segmentos Google Analytics
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Segmento</TableCell>
                  <TableCell align="right">Sessões</TableCell>
                  <TableCell align="right">Usuários</TableCell>
                  <TableCell align="right">Pageviews</TableCell>
                  <TableCell align="right">Duração Média</TableCell>
                  <TableCell align="right">Taxa de Rejeição</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.googleAnalytics.segments.map((segment, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {segment.dimensions?.join(' - ') || `Segmento ${index + 1}`}
                    </TableCell>
                    <TableCell align="right">{formatNumber(segment.sessions)}</TableCell>
                    <TableCell align="right">{formatNumber(segment.users)}</TableCell>
                    <TableCell align="right">{formatNumber(segment.pageviews)}</TableCell>
                    <TableCell align="right">{(segment.avgSessionDuration || 0).toFixed(2)}s</TableCell>
                    <TableCell align="right">{(segment.bounceRate || 0).toFixed(2)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );

  return (
    <Box>
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Resultados do Relatório
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              label={config.reportType === 'combined' ? 'Meta + GA' : 
                     config.reportType === 'meta' ? 'Meta Ads' : 'Google Analytics'} 
              color="primary" 
              size="small"
            />
            <Chip 
              label={`${config.startDate} até ${config.endDate}`} 
              variant="outlined" 
              size="small"
            />
            <Chip 
              label={data.company?.name || 'Empresa'} 
              variant="outlined" 
              size="small"
            />
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Exportar Relatório">
            <IconButton color="primary">
              <ExportIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Compartilhar">
            <IconButton color="primary">
              <ShareIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Cards de resumo */}
      {renderSummaryCards()}

      {/* Abas de visualização */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<ChartIcon />} label="Gráficos" />
          <Tab icon={<TableIcon />} label="Tabelas" />
        </Tabs>
      </Paper>

      {/* Conteúdo das abas */}
      {activeTab === 0 && renderCharts()}
      {activeTab === 1 && renderTables()}

      {/* Informações do relatório */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.50' }}>
        <Typography variant="subtitle2" gutterBottom>
          Informações do Relatório
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Empresa:</strong> {data.company?.name} <br/>
          <strong>Período:</strong> {config.startDate} até {config.endDate} <br/>
          <strong>Tipo:</strong> {config.reportType} <br/>
          <strong>Gerado em:</strong> {new Date().toLocaleString('pt-BR')}
        </Typography>
      </Paper>
    </Box>
  );
};

export default ReportVisualization; 