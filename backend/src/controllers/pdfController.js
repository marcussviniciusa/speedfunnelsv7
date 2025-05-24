import PdfService from '../services/PdfService.js';

class PdfController {
  // Gerar PDF do dashboard atual
  async generateDashboardPDF(req, res) {
    try {
      console.log('📄 Requisição para gerar PDF do dashboard');
      
      const {
        startDate = '30daysAgo',
        endDate = 'today',
        metaAccounts = '',
        gaAccounts = '',
        config = {}
      } = req.body;

      // Buscar dados do dashboard
      const dashboardData = await this.getDashboardData({
        startDate,
        endDate,
        metaAccounts,
        gaAccounts,
        userId: req.user.id,
        companyId: req.user.companyId
      });

      // Configuração personalizada
      const pdfConfig = {
        title: config.title || 'Relatório de Dashboard',
        companyName: config.companyName || req.user.companyName || 'Sua Empresa',
        logoUrl: config.logoUrl || null,
        primaryColor: config.primaryColor || '#1976d2',
        dateRange: this.formatDateRange(startDate, endDate)
      };

      // Gerar HTML do relatório
      const htmlContent = PdfService.generateDashboardHTML(dashboardData, pdfConfig);

      // Opções do PDF
      const pdfOptions = {
        format: config.format || 'A4',
        landscape: config.landscape || false,
        margin: config.margin || {
          top: '20mm',
          bottom: '20mm',
          left: '15mm',
          right: '15mm'
        }
      };

      // Gerar PDF
      const pdfBuffer = await PdfService.generatePDF(htmlContent, pdfOptions);

      // Definir headers para download
      const filename = `dashboard-${new Date().toISOString().split('T')[0]}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Enviar PDF
      res.send(pdfBuffer);

      console.log('✅ PDF do dashboard gerado e enviado com sucesso');

    } catch (error) {
      console.error('❌ Erro ao gerar PDF do dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar PDF do dashboard',
        error: error.message
      });
    }
  }

  // Gerar PDF de relatório personalizado  
  async generateReportPDF(req, res) {
    try {
      console.log('📄 Requisição para gerar PDF de relatório personalizado');
      
      const {
        reportData,
        config = {},
        template = 'dashboard'
      } = req.body;

      if (!reportData) {
        return res.status(400).json({
          success: false,
          message: 'Dados do relatório são obrigatórios'
        });
      }

      // Configuração personalizada
      const pdfConfig = {
        title: config.title || 'Relatório Personalizado',
        companyName: config.companyName || req.user.companyName || 'Sua Empresa',
        logoUrl: config.logoUrl || null,
        primaryColor: config.primaryColor || '#1976d2',
        dateRange: config.dateRange || 'Período Customizado'
      };

      let htmlContent;

      // Escolher template baseado no tipo
      switch (template) {
        case 'executive':
          htmlContent = this.generateExecutiveHTML(reportData, pdfConfig);
          break;
        case 'detailed':
          htmlContent = this.generateDetailedHTML(reportData, pdfConfig);
          break;
        case 'dashboard':
        default:
          htmlContent = PdfService.generateDashboardHTML(reportData, pdfConfig);
          break;
      }

      // Opções do PDF
      const pdfOptions = {
        format: config.format || 'A4',
        landscape: config.landscape || false,
        margin: config.margin
      };

      // Gerar PDF
      const pdfBuffer = await PdfService.generatePDF(htmlContent, pdfOptions);

      // Definir headers para download
      const filename = `relatorio-${template}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Enviar PDF
      res.send(pdfBuffer);

      console.log('✅ PDF de relatório personalizado gerado com sucesso');

    } catch (error) {
      console.error('❌ Erro ao gerar PDF de relatório:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar PDF de relatório',
        error: error.message
      });
    }
  }

  // Preview de PDF (retorna HTML ao invés do PDF)
  async previewPDF(req, res) {
    try {
      console.log('👀 Requisição para preview de PDF');
      
      const {
        reportData,
        config = {},
        template = 'dashboard'
      } = req.body;

      if (!reportData) {
        return res.status(400).json({
          success: false,
          message: 'Dados do relatório são obrigatórios'
        });
      }

      // Configuração personalizada
      const pdfConfig = {
        title: config.title || 'Preview do Relatório',
        companyName: config.companyName || req.user.companyName || 'Sua Empresa',
        logoUrl: config.logoUrl || null,
        primaryColor: config.primaryColor || '#1976d2',
        dateRange: config.dateRange || 'Período Customizado'
      };

      let htmlContent;

      // Escolher template baseado no tipo
      switch (template) {
        case 'executive':
          htmlContent = this.generateExecutiveHTML(reportData, pdfConfig);
          break;
        case 'detailed':
          htmlContent = this.generateDetailedHTML(reportData, pdfConfig);
          break;
        case 'dashboard':
        default:
          htmlContent = PdfService.generateDashboardHTML(reportData, pdfConfig);
          break;
      }

      // Retornar HTML para preview
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlContent);

      console.log('✅ Preview HTML gerado com sucesso');

    } catch (error) {
      console.error('❌ Erro ao gerar preview:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar preview',
        error: error.message
      });
    }
  }

  // Buscar dados do dashboard para o PDF
  async getDashboardData(params) {
    try {
      // Esta função deveria integrar com o dashboardAPI ou duplicar a lógica
      // Por enquanto, vamos usar dados mockados baseados no padrão atual
      
      // TODO: Integrar com o serviço real de dashboard
      return {
        metaAds: {
          totalSpend: 15420.50,
          totalImpressions: 485620,
          totalClicks: 12850,
          avgCTR: 2.64,
          accounts: [
            {
              accountName: 'Conta Principal',
              spend: 8500.30,
              impressions: 285000,
              clicks: 7500,
              ctr: 2.63
            },
            {
              accountName: 'Conta Secundária',
              spend: 6920.20,
              impressions: 200620,
              clicks: 5350,
              ctr: 2.67
            }
          ]
        },
        googleAnalytics: {
          totalSessions: 28590,
          totalUsers: 21450,
          totalPageviews: 75820,
          accounts: [
            {
              propertyName: 'Website Principal',
              sessions: 18590,
              users: 14250,
              pageviews: 48200
            },
            {
              propertyName: 'Landing Pages',
              sessions: 10000,
              users: 7200,
              pageviews: 27620
            }
          ]
        }
      };
    } catch (error) {
      console.error('❌ Erro ao buscar dados do dashboard:', error);
      throw error;
    }
  }

  // Template Executivo (resumido)
  generateExecutiveHTML(data, config) {
    const {
      title = 'Relatório Executivo',
      companyName = 'Sua Empresa',
      logoUrl = null,
      primaryColor = '#1976d2',
      dateRange = 'Período'
    } = config;

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px 0;
            border-bottom: 3px solid ${primaryColor};
          }
          
          .title {
            color: ${primaryColor};
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          
          .subtitle {
            color: #666;
            font-size: 18px;
          }
          
          .summary-box {
            background: linear-gradient(135deg, ${primaryColor}10, ${primaryColor}20);
            border-left: 5px solid ${primaryColor};
            padding: 25px;
            margin: 30px 0;
            border-radius: 8px;
          }
          
          .key-metrics {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 30px 0;
          }
          
          .metric {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e9ecef;
          }
          
          .metric-value {
            font-size: 28px;
            font-weight: bold;
            color: ${primaryColor};
          }
          
          .metric-label {
            color: #666;
            font-size: 14px;
            margin-top: 5px;
          }
          
          .insights {
            margin: 30px 0;
          }
          
          .insight-item {
            margin: 15px 0;
            padding-left: 20px;
            border-left: 3px solid ${primaryColor};
          }
          
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-height: 80px; margin-bottom: 20px;">` : ''}
          <h1 class="title">${title}</h1>
          <h2 class="subtitle">${companyName} - ${dateRange}</h2>
        </div>
        
        <div class="summary-box">
          <h3>📊 Resumo Executivo</h3>
          <p>Este relatório consolida as principais métricas de performance para o período analisado, destacando os resultados mais relevantes para a tomada de decisão estratégica.</p>
        </div>
        
        <div class="key-metrics">
          ${data.metaAds ? `
            <div class="metric">
              <div class="metric-value">R$ ${this.formatCurrency(data.metaAds.totalSpend || 0)}</div>
              <div class="metric-label">Investimento Total</div>
            </div>
            <div class="metric">
              <div class="metric-value">${(data.metaAds.avgCTR || 0).toFixed(2)}%</div>
              <div class="metric-label">CTR Médio</div>
            </div>
          ` : ''}
          
          ${data.googleAnalytics ? `
            <div class="metric">
              <div class="metric-value">${this.formatNumber(data.googleAnalytics.totalSessions || 0)}</div>
              <div class="metric-label">Sessões Totais</div>
            </div>
            <div class="metric">
              <div class="metric-value">${this.formatNumber(data.googleAnalytics.totalUsers || 0)}</div>
              <div class="metric-label">Usuários Únicos</div>
            </div>
          ` : ''}
        </div>
        
        <div class="insights">
          <h3>🎯 Principais Insights</h3>
          
          <div class="insight-item">
            <strong>Performance de Anúncios:</strong> 
            ${data.metaAds ? `Investimento de R$ ${this.formatCurrency(data.metaAds.totalSpend || 0)} gerou ${this.formatNumber(data.metaAds.totalImpressions || 0)} impressões com CTR de ${(data.metaAds.avgCTR || 0).toFixed(2)}%.` : 'Dados não disponíveis.'}
          </div>
          
          <div class="insight-item">
            <strong>Tráfego do Website:</strong>
            ${data.googleAnalytics ? `${this.formatNumber(data.googleAnalytics.totalSessions || 0)} sessões registradas com ${this.formatNumber(data.googleAnalytics.totalUsers || 0)} usuários únicos.` : 'Dados não disponíveis.'}
          </div>
          
          <div class="insight-item">
            <strong>Eficiência:</strong> 
            ${data.metaAds && data.googleAnalytics ? 
              `Custo por sessão estimado: R$ ${((data.metaAds.totalSpend || 0) / (data.googleAnalytics.totalSessions || 1)).toFixed(2)}` : 
              'Cálculo não disponível.'
            }
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Template Detalhado (completo)
  generateDetailedHTML(data, config) {
    // Por simplicidade, usar o template dashboard por enquanto
    // Em implementação futura, criar template mais detalhado
    return PdfService.generateDashboardHTML(data, config);
  }

  // Utilitários
  formatDateRange(startDate, endDate) {
    if (startDate === '30daysAgo' && endDate === 'today') {
      return 'Últimos 30 dias';
    }
    if (startDate === '7daysAgo' && endDate === 'today') {
      return 'Últimos 7 dias';
    }
    if (startDate === '90daysAgo' && endDate === 'today') {
      return 'Últimos 90 dias';
    }
    return `${startDate} até ${endDate}`;
  }

  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatNumber(value) {
    return new Intl.NumberFormat('pt-BR').format(value);
  }
}

export default new PdfController(); 