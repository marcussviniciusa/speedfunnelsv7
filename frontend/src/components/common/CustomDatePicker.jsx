import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Paper,
  Grid,
  Divider
} from '@mui/material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/datepicker-custom.css';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CustomDatePicker = ({ 
  startDate, 
  endDate, 
  onChange, 
  label = 'Período',
  variant = 'outlined',
  size = 'medium',
  disabled = false 
}) => {
  const [dateRange, setDateRange] = useState('30daysAgo');
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Opções de período pré-definidas
  const predefinedRanges = [
    { value: 'today', label: 'Hoje' },
    { value: 'yesterday', label: 'Ontem' },
    { value: '7daysAgo', label: 'Últimos 7 dias' },
    { value: '30daysAgo', label: 'Últimos 30 dias' },
    { value: '90daysAgo', label: 'Últimos 90 dias' },
    { value: 'thisMonth', label: 'Este mês' },
    { value: 'lastMonth', label: 'Mês passado' },
    { value: 'custom', label: 'Personalizado' }
  ];

  // Converter datas relativas para objetos Date
  const convertToDate = (dateString) => {
    const today = new Date();
    
    switch (dateString) {
      case 'today':
        return today;
      case 'yesterday':
        return subDays(today, 1);
      case '7daysAgo':
        return subDays(today, 7);
      case '30daysAgo':
        return subDays(today, 30);
      case '90daysAgo':
        return subDays(today, 90);
      case 'thisMonth':
        return startOfMonth(today);
      case 'lastMonth':
        return startOfMonth(subMonths(today, 1));
      default:
        return today;
    }
  };

  // Converter data para formato YYYY-MM-DD
  const formatDateForAPI = (date) => {
    if (!date) return null;
    return format(date, 'yyyy-MM-dd');
  };

  // Converter string YYYY-MM-DD para Date local (sem problemas de fuso horário)
  const parseLocalDate = (dateString) => {
    if (!dateString || !dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return null;
    const [year, month, day] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  // Detectar se as datas atuais correspondem a um período pré-definido
  useEffect(() => {
    if (startDate && endDate) {
      // Se as datas são strings de período relativo
      if (typeof startDate === 'string' && predefinedRanges.find(r => r.value === startDate)) {
        setDateRange(startDate);
        setShowCustomPicker(false);
        return;
      }

      // Se são datas personalizadas em formato YYYY-MM-DD
      if (typeof startDate === 'string' && startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        setDateRange('custom');
        setCustomStartDate(parseLocalDate(startDate));
        setCustomEndDate(parseLocalDate(endDate));
        setShowCustomPicker(true);
        return;
      }
    }
  }, [startDate, endDate]);

  // Manipular mudança de período pré-definido
  const handleRangeChange = (event) => {
    const value = event.target.value;
    setDateRange(value);

    if (value === 'custom') {
      setShowCustomPicker(true);
      // Inicializar com últimos 30 dias se não há datas customizadas
      if (!customStartDate || !customEndDate) {
        const endDate = new Date();
        const startDate = subDays(endDate, 30);
        setCustomStartDate(startDate);
        setCustomEndDate(endDate);
        onChange({
          startDate: formatDateForAPI(startDate),
          endDate: formatDateForAPI(endDate)
        });
      } else {
        onChange({
          startDate: formatDateForAPI(customStartDate),
          endDate: formatDateForAPI(customEndDate)
        });
      }
    } else {
      setShowCustomPicker(false);
      onChange({
        startDate: value,
        endDate: value === 'thisMonth' || value === 'lastMonth' ? 
          formatDateForAPI(endOfMonth(convertToDate(value))) : 'today'
      });
    }
  };

  // Manipular mudança de data personalizada
  const handleCustomDateChange = (dates) => {
    const [start, end] = dates;
    setCustomStartDate(start);
    setCustomEndDate(end);

    if (start && end) {
      onChange({
        startDate: formatDateForAPI(start),
        endDate: formatDateForAPI(end)
      });
    }
  };

  return (
    <Box>
      <FormControl fullWidth variant={variant} size={size} disabled={disabled}>
        <InputLabel>{label}</InputLabel>
        <Select
          value={dateRange}
          onChange={handleRangeChange}
          label={label}
        >
          {predefinedRanges.map((range) => (
            <MenuItem key={range.value} value={range.value}>
              {range.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {showCustomPicker && (
        <Paper sx={{ mt: 2, p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom color="primary">
            Selecionar Período Personalizado
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <DatePicker
              selected={customStartDate}
              onChange={handleCustomDateChange}
              startDate={customStartDate}
              endDate={customEndDate}
              selectsRange
              inline
              locale={ptBR}
              dateFormat="dd/MM/yyyy"
              maxDate={new Date()}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
          </Box>

          {customStartDate && customEndDate && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">
                    Data Inicial:
                  </Typography>
                  <Typography variant="body1">
                    {format(customStartDate, 'dd/MM/yyyy', { locale: ptBR })}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">
                    Data Final:
                  </Typography>
                  <Typography variant="body1">
                    {format(customEndDate, 'dd/MM/yyyy', { locale: ptBR })}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default CustomDatePicker; 