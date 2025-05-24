import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Avatar
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Speed as SpeedIcon,
  MobileScreenShare as MobileIcon,
  Analytics as AnalyticsIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';

const PredefinedReports = ({ reports, onApply, loading }) => {
  // Mapear ícones para diferentes tipos de relatório
  const getReportIcon = (reportId) => {
    const iconMap = {
      'performance_overview': <AssessmentIcon />,
      'meta_campaigns_analysis': <TrendingUpIcon />,
      'ga_traffic_analysis': <AnalyticsIcon />,
      'roi_analysis': <MoneyIcon />,
      'high_performance_campaigns': <SpeedIcon />,
      'mobile_traffic_report': <MobileIcon />
    };
    return iconMap[reportId] || <AssessmentIcon />;
  };

  // Mapear cores para categorias
  const getCategoryColor = (category) => {
    const colorMap = {
      'Geral': 'primary',
      'Meta Ads': 'secondary',
      'Google Analytics': 'success',
      'Análise': 'warning'
    };
    return colorMap[category] || 'default';
  };

  // Renderizar chip de complexidade baseado nos filtros
  const getComplexityChip = (config) => {
    if (!config.queryBuilderRule || !config.queryBuilderRule.rules) {
      return <Chip label="Simples" size="small" color="success" />;
    }
    
    const rulesCount = config.queryBuilderRule.rules.length;
    if (rulesCount <= 2) {
      return <Chip label="Intermediário" size="small" color="warning" />;
    }
    return <Chip label="Avançado" size="small" color="error" />;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Relatórios Pré-definidos
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Selecione um dos relatórios pré-configurados abaixo para análises rápidas e insights específicos.
      </Typography>

      <Grid container spacing={3}>
        {reports.map((report) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={report.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                {/* Cabeçalho do card */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: `${getCategoryColor(report.category)}.main`,
                      mr: 2 
                    }}
                  >
                    {getReportIcon(report.id)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="h3">
                      {report.name}
                    </Typography>
                    <Chip 
                      label={report.category} 
                      size="small" 
                      color={getCategoryColor(report.category)}
                      variant="outlined"
                    />
                  </Box>
                </Box>

                {/* Descrição */}
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ mb: 2, minHeight: '3em' }}
                >
                  {report.description}
                </Typography>

                {/* Detalhes da configuração */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Chip 
                    label={report.config.reportType === 'combined' ? 'Meta + GA' : 
                           report.config.reportType === 'meta' ? 'Meta Ads' : 'Google Analytics'} 
                    size="small" 
                    variant="outlined"
                  />
                  {getComplexityChip(report.config)}
                  <Chip 
                    label={report.config.defaultDateRange === '30daysAgo' ? '30 dias' : 
                           report.config.defaultDateRange || 'Padrão'} 
                    size="small" 
                    variant="outlined"
                  />
                </Box>

                {/* Filtros aplicados */}
                {report.config.queryBuilderRule && report.config.queryBuilderRule.rules && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Filtros pré-configurados:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {report.config.queryBuilderRule.rules.map((rule, index) => (
                        <Chip 
                          key={index}
                          label={`${rule.field} ${rule.operator} ${rule.value}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Segmentação */}
                {(report.config.segmentation?.metaLevel || report.config.segmentation?.gaDimensions) && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Segmentação:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {report.config.segmentation.metaLevel && (
                        <Chip 
                          label={`Meta: ${report.config.segmentation.metaLevel}`}
                          size="small"
                          color="secondary"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                      {report.config.segmentation.gaDimensions && (
                        <Chip 
                          label={`GA: ${report.config.segmentation.gaDimensions.join(', ')}`}
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  </Box>
                )}
              </CardContent>

              <CardActions>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => onApply(report.config)}
                  disabled={loading}
                  startIcon={<AssessmentIcon />}
                >
                  Aplicar Relatório
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Mensagem quando não há relatórios */}
      {reports.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Nenhum relatório pré-definido disponível.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PredefinedReports; 