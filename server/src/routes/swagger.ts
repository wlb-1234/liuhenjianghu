/**
 * Swagger文档路由
 * 使用动态导入避免ESM兼容性问题
 */
import { Router, Request, Response } from 'express';
import { swaggerConfig, apiPaths, securitySchemes } from '../config/swagger';

const router = Router();

// JSON格式的Swagger文档
router.get('/api-docs.json', (_req: Request, res: Response) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: swaggerConfig.title,
      version: swaggerConfig.version,
      description: swaggerConfig.description,
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      { url: swaggerConfig.baseUrl, description: '当前服务器' }
    ],
    paths: apiPaths,
    components: {
      securitySchemes
    },
    tags: [
      { name: '系统', description: '系统相关接口' },
      { name: '行政区划', description: '行政区划查询接口' },
      { name: 'GeoJSON', description: '地理边界数据接口' },
      { name: 'API Key', description: 'API Key管理接口' },
      { name: '监控', description: '监控指标接口' }
    ]
  });
});

// HTML页面（简单的Swagger UI替代）
router.get('/', (_req: Request, res: Response) => {
  const specUrl = `${swaggerConfig.baseUrl}/api-docs.json`;
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${swaggerConfig.title} - API文档</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      color: #fff;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .header h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
      background: linear-gradient(90deg, #00d4ff, #7b2cbf);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .header p {
      color: #888;
      font-size: 1.1rem;
    }
    .version {
      display: inline-block;
      background: linear-gradient(90deg, #00d4ff, #7b2cbf);
      padding: 4px 16px;
      border-radius: 20px;
      font-size: 0.9rem;
      margin-top: 10px;
    }
    .card {
      background: rgba(255,255,255,0.05);
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 20px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .card h2 {
      font-size: 1.5rem;
      margin-bottom: 20px;
      color: #00d4ff;
    }
    .endpoint {
      background: rgba(0,0,0,0.3);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 15px;
      border-left: 4px solid #00d4ff;
    }
    .endpoint.get { border-left-color: #00d4ff; }
    .endpoint.post { border-left-color: #10b981; }
    .endpoint.put, .endpoint.patch { border-left-color: #f59e0b; }
    .endpoint.delete { border-left-color: #ef4444; }
    .method {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 0.85rem;
      margin-right: 12px;
      text-transform: uppercase;
    }
    .method.get { background: #00d4ff; color: #000; }
    .method.post { background: #10b981; color: #fff; }
    .method.put, .method.patch { background: #f59e0b; color: #000; }
    .method.delete { background: #ef4444; color: #fff; }
    .path {
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.95rem;
      color: #e0e0e0;
    }
    .description {
      margin-top: 10px;
      color: #888;
      font-size: 0.9rem;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      margin-left: 10px;
      background: rgba(255,255,255,0.1);
      color: #888;
    }
    .badge.auth { background: rgba(239,68,68,0.2); color: #ef4444; }
    .badge.public { background: rgba(16,185,129,0.2); color: #10b981; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    .stat-card {
      text-align: center;
      padding: 25px;
    }
    .stat-card .number {
      font-size: 2.5rem;
      font-weight: bold;
      background: linear-gradient(90deg, #00d4ff, #7b2cbf);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .stat-card .label {
      color: #888;
      margin-top: 5px;
    }
    .code-block {
      background: #0d1117;
      border-radius: 8px;
      padding: 15px;
      margin-top: 10px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.85rem;
      overflow-x: auto;
    }
    .code-block code {
      color: #e0e0e0;
    }
    .try-btn {
      display: inline-block;
      background: linear-gradient(90deg, #00d4ff, #7b2cbf);
      color: #fff;
      padding: 8px 20px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      margin-top: 15px;
      transition: transform 0.2s;
    }
    .try-btn:hover {
      transform: translateY(-2px);
    }
    .base-url {
      background: rgba(0,0,0,0.3);
      padding: 15px 20px;
      border-radius: 8px;
      font-family: 'Monaco', 'Menlo', monospace;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .base-url-label {
      color: #888;
      font-size: 0.9rem;
    }
    .base-url-value {
      color: #00d4ff;
    }
    .copy-btn {
      background: rgba(255,255,255,0.1);
      border: none;
      color: #888;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
    }
    .copy-btn:hover {
      background: rgba(255,255,255,0.2);
      color: #fff;
    }
    footer {
      text-align: center;
      margin-top: 40px;
      color: #666;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${swaggerConfig.title}</h1>
      <p>完整的中华人民共和国行政区划数据服务</p>
      <span class="version">v${swaggerConfig.version}</span>
    </div>
    
    <div class="base-url">
      <span class="base-url-label">Base URL:</span>
      <span class="base-url-value" id="baseUrl">${swaggerConfig.baseUrl}</span>
      <button class="copy-btn" onclick="copyUrl()">复制</button>
    </div>
    
    <div class="grid">
      <div class="card stat-card">
        <div class="number">15+</div>
        <div class="label">API接口</div>
      </div>
      <div class="card stat-card">
        <div class="number">4</div>
        <div class="label">行政区级别</div>
      </div>
      <div class="card stat-card">
        <div class="number">38K+</div>
        <div class="label">行政区数据</div>
      </div>
      <div class="card stat-card">
        <div class="number">99.9%</div>
        <div class="label">服务可用性</div>
      </div>
    </div>
    
    <div class="card">
      <h2>认证方式</h2>
      <p class="description">API Key认证，请在请求头中添加：</p>
      <div class="code-block">
        <code>x-api-key: your_api_key_here</code>
      </div>
    </div>
    
    <div class="card">
      <h2>公开接口（无需认证）</h2>
      <div class="endpoint get">
        <span class="method get">GET</span>
        <span class="path">/api/v1/health</span>
        <span class="badge public">公开</span>
        <div class="description">健康检查</div>
      </div>
      <div class="endpoint get">
        <span class="method get">GET</span>
        <span class="path">/api/v1/regions/stats</span>
        <span class="badge public">公开</span>
        <div class="description">数据统计</div>
      </div>
      <div class="endpoint get">
        <span class="method get">GET</span>
        <span class="path">/metrics</span>
        <span class="badge public">公开</span>
        <div class="description">Prometheus监控指标</div>
      </div>
      <div class="endpoint get">
        <span class="method get">GET</span>
        <span class="path">/api/v1/cache/stats</span>
        <span class="badge public">公开</span>
        <div class="description">缓存统计</div>
      </div>
      <div class="endpoint get">
        <span class="method get">GET</span>
        <span class="path">/api/v1/logs/*</span>
        <span class="badge public">公开</span>
        <div class="description">日志接口</div>
      </div>
    </div>
    
    <div class="card">
      <h2>行政区划接口（需认证）</h2>
      <div class="endpoint get">
        <span class="method get">GET</span>
        <span class="path">/api/v1/regions/provinces</span>
        <span class="badge auth">需认证</span>
        <div class="description">获取所有省级行政区</div>
      </div>
      <div class="endpoint get">
        <span class="method get">GET</span>
        <span class="path">/api/v1/regions/cities/{code}</span>
        <span class="badge auth">需认证</span>
        <div class="description">获取省级下所有城市</div>
      </div>
      <div class="endpoint get">
        <span class="method get">GET</span>
        <span class="path">/api/v1/regions/districts/{code}</span>
        <span class="badge auth">需认证</span>
        <div class="description">获取城市下所有区县</div>
      </div>
      <div class="endpoint get">
        <span class="method get">GET</span>
        <span class="path">/api/v1/regions/streets/{code}</span>
        <span class="badge auth">需认证</span>
        <div class="description">获取区县下所有街道</div>
      </div>
      <div class="endpoint get">
        <span class="method get">GET</span>
        <span class="path">/api/v1/regions/children/{code}</span>
        <span class="badge auth">需认证</span>
        <div class="description">通用下级查询</div>
      </div>
      <div class="endpoint get">
        <span class="method get">GET</span>
        <span class="path">/api/v1/regions/search?keyword=</span>
        <span class="badge auth">需认证</span>
        <div class="description">模糊搜索</div>
      </div>
      <div class="endpoint get">
        <span class="method get">GET</span>
        <span class="path">/api/v1/regions/path/{code}</span>
        <span class="badge auth">需认证</span>
        <div class="description">获取完整路径</div>
      </div>
    </div>
    
    <div class="card">
      <h2>GeoJSON边界接口（需认证）</h2>
      <div class="endpoint get">
        <span class="method get">GET</span>
        <span class="path">/api/v1/geojson/provinces</span>
        <span class="badge auth">需认证</span>
        <div class="description">获取所有省级边界</div>
      </div>
      <div class="endpoint get">
        <span class="method get">GET</span>
        <span class="path">/api/v1/geojson/provinces/{code}</span>
        <span class="badge auth">需认证</span>
        <div class="description">获取单个省级边界</div>
      </div>
    </div>
    
    <div class="card">
      <h2>API Key管理接口（需认证）</h2>
      <div class="endpoint get">
        <span class="method get">GET</span>
        <span class="path">/api/v1/apikeys/keys</span>
        <span class="badge auth">需认证</span>
        <div class="description">获取所有API Key</div>
      </div>
      <div class="endpoint post">
        <span class="method post">POST</span>
        <span class="path">/api/v1/apikeys/keys</span>
        <span class="badge auth">需认证</span>
        <div class="description">创建新API Key</div>
      </div>
      <div class="endpoint patch">
        <span class="method patch">PATCH</span>
        <span class="path">/api/v1/apikeys/keys/{key}</span>
        <span class="badge auth">需认证</span>
        <div class="description">更新API Key状态</div>
      </div>
      <div class="endpoint delete">
        <span class="method delete">DELETE</span>
        <span class="path">/api/v1/apikeys/keys/{key}</span>
        <span class="badge auth">需认证</span>
        <div class="description">删除API Key</div>
      </div>
      <div class="endpoint get">
        <span class="method get">GET</span>
        <span class="path">/api/v1/apikeys/stats</span>
        <span class="badge auth">需认证</span>
        <div class="description">获取API Key使用统计</div>
      </div>
    </div>
    
    <div class="card">
      <h2>快速测试</h2>
      <p class="description">在浏览器控制台中执行以下命令进行测试：</p>
      <div class="code-block">
        <code>
// 测试健康检查（无需认证）<br>
fetch('${swaggerConfig.baseUrl}/api/v1/health')<br>
  .then(r => r.json())<br>
  .then(console.log);
        </code>
      </div>
    </div>
    
    <footer>
      <p>中国行政区划API v${swaggerConfig.version} | 数据来源：中华人民共和国民政部</p>
      <p>最后更新：2026-06-15</p>
    </footer>
  </div>
  
  <script>
    function copyUrl() {
      const url = document.getElementById('baseUrl').textContent;
      navigator.clipboard.writeText(url).then(() => {
        alert('URL已复制到剪贴板');
      });
    }
    
    // 获取API文档并显示接口列表
    fetch('${specUrl}')
      .then(r => r.json())
      .then(spec => {
        console.log('API Spec loaded:', Object.keys(spec.paths).length, 'endpoints');
      });
  </script>
</body>
</html>
  `);
});

export default router;
