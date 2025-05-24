import React from 'react';
import {
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  OutlinedInput
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

const SegmentationPanel = ({ options, value, onChange, reportType }) => {
  const handleMetaLevelChange = (level) => {
    onChange({
      ...value,
      metaLevel: level
    });
  };

  const handleGADimensionsChange = (event) => {
    const dimensions = typeof event.target.value === 'string' 
      ? event.target.value.split(',') 
      : event.target.value;
    
    onChange({
      ...value,
      gaDimensions: dimensions
    });
  };

  const handleMetaBreakdownsChange = (event) => {
    const breakdowns = typeof event.target.value === 'string' 
      ? event.target.value.split(',') 
      : event.target.value;
    
    onChange({
      ...value,
      metaBreakdowns: breakdowns
    });
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Segmentação de Dados
      </Typography>

      {/* Meta Ads Segmentation */}
      {(reportType === 'meta' || reportType === 'combined') && options.metaAds && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Meta Ads</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Nível de segmentação Meta */}
              <FormControl fullWidth size="small">
                <InputLabel>Nível de Análise</InputLabel>
                <Select
                  value={value.metaLevel || ''}
                  label="Nível de Análise"
                  onChange={(e) => handleMetaLevelChange(e.target.value)}
                >
                  {options.metaAds.levels?.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      {level.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Breakdown Meta */}
              <FormControl fullWidth size="small">
                <InputLabel>Segmentação Adicional</InputLabel>
                <Select
                  multiple
                  value={value.metaBreakdowns || []}
                  onChange={handleMetaBreakdownsChange}
                  input={<OutlinedInput label="Segmentação Adicional" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((item) => {
                        const breakdown = options.metaAds.breakdowns?.find(b => b.value === item);
                        return (
                          <Chip 
                            key={item} 
                            label={breakdown?.label || item} 
                            size="small" 
                            color="secondary"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {options.metaAds.breakdowns?.map((breakdown) => (
                    <MenuItem key={breakdown.value} value={breakdown.value}>
                      {breakdown.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Google Analytics Segmentation */}
      {(reportType === 'ga' || reportType === 'combined') && options.googleAnalytics && (
        <Accordion defaultExpanded={reportType === 'ga'}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Google Analytics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormControl fullWidth size="small">
              <InputLabel>Dimensões</InputLabel>
              <Select
                multiple
                value={value.gaDimensions || []}
                onChange={handleGADimensionsChange}
                input={<OutlinedInput label="Dimensões" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((item) => {
                      const dimension = options.googleAnalytics.dimensions?.find(d => d.value === item);
                      return (
                        <Chip 
                          key={item} 
                          label={dimension?.label || item} 
                          size="small" 
                          color="success"
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {options.googleAnalytics.dimensions?.map((dimension) => (
                  <MenuItem key={dimension.value} value={dimension.value}>
                    {dimension.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Resumo da segmentação atual */}
      {(value.metaLevel || value.gaDimensions?.length > 0 || value.metaBreakdowns?.length > 0) && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Segmentação Ativa:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
            {value.metaLevel && (
              <Chip 
                label={`Meta: ${options.metaAds?.levels?.find(l => l.value === value.metaLevel)?.label || value.metaLevel}`}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
            {value.metaBreakdowns?.map((breakdown) => (
              <Chip 
                key={breakdown}
                label={`Meta: ${options.metaAds?.breakdowns?.find(b => b.value === breakdown)?.label || breakdown}`}
                size="small"
                color="secondary"
                variant="outlined"
              />
            ))}
            {value.gaDimensions?.map((dimension) => (
              <Chip 
                key={dimension}
                label={`GA: ${options.googleAnalytics?.dimensions?.find(d => d.value === dimension)?.label || dimension}`}
                size="small"
                color="success"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Dica de uso */}
      <Box sx={{ mt: 2, p: 1, bgcolor: 'info.light', borderRadius: 1, color: 'info.contrastText' }}>
        <Typography variant="caption">
          💡 Dica: Use segmentação para analisar dados por diferentes critérios como dispositivo, idade, localização, etc.
        </Typography>
      </Box>
    </Paper>
  );
};

export default SegmentationPanel; 