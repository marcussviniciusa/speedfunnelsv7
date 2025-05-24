import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PdfService {
  constructor() {
    this.browser = null;
    this.isInitialized = false;
  }

  // Inicializar browser para reutilização (performance)
  async initializeBrowser() {
    if (!this.browser || !this.isInitialized) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      this.isInitialized = true;
      console.log('🚀 Puppeteer browser inicializado para geração de PDF');
    }
    return this.browser;
  }

  // Fechar browser quando não precisar mais
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.isInitialized = false;
      console.log('🔴 Puppeteer browser fechado');
    }
  }

  // Método principal para gerar PDF
  async generatePDF(htmlContent, options = {}) {
    const browser = await this.initializeBrowser();
    const page = await browser.newPage();

    try {
      console.log('📄 Iniciando geração de PDF...');

      // Configurar viewport para melhor renderização
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 2 // Para melhor qualidade de imagem
      });

      // Definir conteúdo HTML
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Emular media type para impressão
      await page.emulateMediaType('print');

      // Configurações padrão do PDF
      const defaultOptions = {
        format: 'A4',
        margin: {
          top: '20mm',
          bottom: '20mm', 
          left: '15mm',
          right: '15mm'
        },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: options.headerTemplate || this.getDefaultHeaderTemplate(),
        footerTemplate: options.footerTemplate || this.getDefaultFooterTemplate(),
        preferCSSPageSize: false
      };

      // Mesclar opções customizadas
      const pdfOptions = { ...defaultOptions, ...options };

      console.log('⚙️ Configurações PDF:', pdfOptions);

      // Gerar PDF
      const pdfBuffer = await page.pdf(pdfOptions);
      
      console.log('✅ PDF gerado com sucesso');
      return pdfBuffer;

    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      throw new Error(`Falha na geração do PDF: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  // Gerar PDF a partir de URL
  async generatePDFFromURL(url, options = {}) {
    const browser = await this.initializeBrowser();
    const page = await browser.newPage();

    try {
      console.log('🌐 Gerando PDF a partir da URL:', url);

      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      await page.emulateMediaType('print');

      const defaultOptions = {
        format: 'A4',
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
        printBackground: true
      };

      const pdfOptions = { ...defaultOptions, ...options };
      const pdfBuffer = await page.pdf(pdfOptions);
      
      console.log('✅ PDF gerado a partir da URL');
      return pdfBuffer;

    } catch (error) {
      console.error('❌ Erro ao gerar PDF da URL:', error);
      throw new Error(`Falha na geração do PDF da URL: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  // Template padrão de cabeçalho
  getDefaultHeaderTemplate() {
    return `
      <div style="font-size: 10px; margin: 0 auto; width: 100%; text-align: center; color: #666;">
        <span>SpeedFunnels - Relatório de Marketing Digital</span>
      </div>
    `;
  }

  // Template padrão de rodapé
  getDefaultFooterTemplate() {
    return `
      <div style="font-size: 10px; margin: 0 auto; width: 100%; text-align: center; color: #666; display: flex; justify-content: space-between; align-items: center;">
        <span>Gerado em: <span class="date"></span></span>
        <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
        <span>www.speedfunnels.com</span>
      </div>
    `;
  }

  // Gerar template HTML customizado para dashboard
  generateDashboardHTML(data, config = {}) {
    const {
      title = 'Relatório de Dashboard',
      companyName = 'Sua Empresa',
      logoUrl = null,
      primaryColor = '#1976d2',
      dateRange = 'Últimos 30 dias'
    } = config;

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px 0;
            border-bottom: 2px solid ${primaryColor};
          }
          
          .logo {
            max-height: 60px;
            margin-bottom: 10px;
          }
          
          .title {
            color: ${primaryColor};
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .subtitle {
            color: #666;
            font-size: 16px;
          }
          
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          
          .metric-card {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            border-left: 4px solid ${primaryColor};
          }
          
          .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: ${primaryColor};
            margin-bottom: 5px;
          }
          
          .metric-label {
            color: #666;
            font-size: 14px;
          }
          
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          
          .section-title {
            color: ${primaryColor};
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
          }
          
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          
          .data-table th,
          .data-table td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
          }
          
          .data-table th {
            background-color: ${primaryColor};
            color: white;
            font-weight: bold;
          }
          
          .data-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            
            .page-break {
              page-break-before: always;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo">` : ''}
          <h1 class="title">${title}</h1>
          <h2 class="subtitle">${companyName} - ${dateRange}</h2>
        </div>
        
        <div class="section">
          <h3 class="section-title">📊 Métricas Principais</h3>
          <div class="metrics-grid">
            ${data.metaAds ? `
              <div class="metric-card">
                <div class="metric-value">R$ ${this.formatCurrency(data.metaAds.totalSpend || 0)}</div>
                <div class="metric-label">Total Investido</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${this.formatNumber(data.metaAds.totalImpressions || 0)}</div>
                <div class="metric-label">Impressões</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${this.formatNumber(data.metaAds.totalClicks || 0)}</div>
                <div class="metric-label">Cliques</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${(data.metaAds.avgCTR || 0).toFixed(2)}%</div>
                <div class="metric-label">CTR Médio</div>
              </div>
            ` : ''}
            
            ${data.googleAnalytics ? `
              <div class="metric-card">
                <div class="metric-value">${this.formatNumber(data.googleAnalytics.totalSessions || 0)}</div>
                <div class="metric-label">Sessões</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${this.formatNumber(data.googleAnalytics.totalUsers || 0)}</div>
                <div class="metric-label">Usuários</div>
              </div>
            ` : ''}
          </div>
        </div>
        
        ${data.metaAds && data.metaAds.accounts && data.metaAds.accounts.length > 0 ? `
          <div class="section">
            <h3 class="section-title">📈 Meta Ads - Detalhamento por Conta</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Conta</th>
                  <th>Gasto</th>
                  <th>Impressões</th>
                  <th>Cliques</th>
                  <th>CTR</th>
                </tr>
              </thead>
              <tbody>
                ${data.metaAds.accounts.map(account => `
                  <tr>
                    <td>${account.accountName}</td>
                    <td>R$ ${this.formatCurrency(account.spend || 0)}</td>
                    <td>${this.formatNumber(account.impressions || 0)}</td>
                    <td>${this.formatNumber(account.clicks || 0)}</td>
                    <td>${(account.ctr || 0).toFixed(2)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
        
        ${data.googleAnalytics && data.googleAnalytics.accounts && data.googleAnalytics.accounts.length > 0 ? `
          <div class="section page-break">
            <h3 class="section-title">📊 Google Analytics - Detalhamento por Propriedade</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Propriedade</th>
                  <th>Sessões</th>
                  <th>Usuários</th>
                  <th>Visualizações</th>
                </tr>
              </thead>
              <tbody>
                ${data.googleAnalytics.accounts.map(account => `
                  <tr>
                    <td>${account.propertyName}</td>
                    <td>${this.formatNumber(account.sessions || 0)}</td>
                    <td>${this.formatNumber(account.users || 0)}</td>
                    <td>${this.formatNumber(account.pageviews || 0)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
        
        <div class="section">
          <h3 class="section-title">📋 Resumo Executivo</h3>
          <p>Este relatório apresenta o desempenho consolidado das campanhas de marketing digital para o período de ${dateRange}.</p>
          ${data.metaAds ? `
            <p><strong>Meta Ads:</strong> Foram investidos R$ ${this.formatCurrency(data.metaAds.totalSpend || 0)} 
            gerando ${this.formatNumber(data.metaAds.totalImpressions || 0)} impressões e 
            ${this.formatNumber(data.metaAds.totalClicks || 0)} cliques, resultando em um CTR médio de 
            ${(data.metaAds.avgCTR || 0).toFixed(2)}%.</p>
          ` : ''}
          ${data.googleAnalytics ? `
            <p><strong>Google Analytics:</strong> O website registrou ${this.formatNumber(data.googleAnalytics.totalSessions || 0)} 
            sessões de ${this.formatNumber(data.googleAnalytics.totalUsers || 0)} usuários únicos.</p>
          ` : ''}
        </div>
      </body>
      </html>
    `;
  }

  // Utilitários de formatação
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatNumber(value) {
    return new Intl.NumberFormat('pt-BR').format(value);
  }

  // Salvar PDF em arquivo (útil para desenvolvimento)
  async savePDFToFile(pdfBuffer, filename) {
    const filepath = path.join(__dirname, '../../temp', filename);
    await fs.writeFile(filepath, pdfBuffer);
    console.log(`💾 PDF salvo em: ${filepath}`);
    return filepath;
  }
}

export default new PdfService(); 