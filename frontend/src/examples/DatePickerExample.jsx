import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Alert,
  Button
} from '@mui/material';
import CustomDatePicker from '../components/common/CustomDatePicker';

const DatePickerExample = () => {
  const [dateRange, setDateRange] = useState({
    startDate: '30daysAgo',
    endDate: 'today'
  });

  const [logs, setLogs] = useState([]);

  const handleDateChange = (newDateRange) => {
    setDateRange(newDateRange);
    
    // Log da mudança para demonstração
    const logEntry = {
      timestamp: new Date().toLocaleTimeString(),
      action: 'Data alterada',
      data: newDateRange
    };
    
    setLogs(prev => [logEntry, ...prev.slice(0, 4)]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        CustomDatePicker - Exemplo de Uso
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Este exemplo demonstra o funcionamento do componente CustomDatePicker 
        com períodos pré-definidos e seleção personalizada de datas.
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Componente CustomDatePicker
        </Typography>
        
        <Box sx={{ maxWidth: 400 }}>
          <CustomDatePicker
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={handleDateChange}
            label="Selecione o Período"
          />
        </Box>
      </Paper>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Estado Atual
          </Typography>
          
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Data Inicial:</strong> {dateRange.startDate}
            </Typography>
            <Typography variant="body2">
              <strong>Data Final:</strong> {dateRange.endDate}
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Log de Alterações
            </Typography>
            <Button size="small" onClick={clearLogs} disabled={logs.length === 0}>
              Limpar
            </Button>
          </Box>
          
          {logs.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Nenhuma alteração registrada ainda. Experimente alterar o período acima.
            </Typography>
          ) : (
            logs.map((log, index) => (
              <Paper 
                key={index} 
                sx={{ 
                  p: 2, 
                  mb: 1, 
                  bgcolor: 'action.hover',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="body2" color="primary">
                  {log.timestamp} - {log.action}
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 1 }}>
                  {JSON.stringify(log.data, null, 2)}
                </Typography>
              </Paper>
            ))
          )}
        </CardContent>
      </Card>

      <Alert severity="success" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>✅ Funcionalidades Testadas:</strong>
        </Typography>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>Períodos pré-definidos (Hoje, Ontem, 7/30/90 dias, Este/Último mês)</li>
          <li>Seleção personalizada com calendário visual</li>
          <li>Conversão automática para formato YYYY-MM-DD</li>
          <li>Detecção automática de formato de entrada</li>
          <li>Estilização integrada com Material-UI</li>
          <li>Estado controlado e callbacks funcionais</li>
        </ul>
      </Alert>
    </Box>
  );
};

export default DatePickerExample; 