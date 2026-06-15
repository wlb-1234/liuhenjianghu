/**
 * Swagger API文档配置
 * 使用动态导入避免ESM兼容性问题
 */

export interface SwaggerConfig {
  title: string;
  version: string;
  description: string;
  baseUrl: string;
}

// Swagger配置
export const swaggerConfig: SwaggerConfig = {
  title: '中国行政区划API',
  version: '2.0.0',
  description: `
提供中华人民共和国完整的行政区划数据，支持四级联动查询。

## 功能特性
- ✅ 四级联动：省→市→区县→街道
- ✅ 港澳台数据支持
- ✅ 经纬度坐标
- ✅ GeoJSON边界数据
- ✅ 模糊搜索
- ✅ 距离计算

## 认证方式
API Key认证，请在请求头中添加：
\`x-api-key: your_api_key\`

## 公开接口（无需认证）
- GET /api/v1/health - 健康检查
- GET /api/v1/regions/stats - 数据统计
- GET /metrics - Prometheus指标
- GET /api/v1/cache/stats - 缓存统计
- GET /api/v1/logs/* - 日志接口
  `,
  baseUrl: process.env.BASE_URL || 'http://localhost:8080'
};

// API路径定义（用于生成Swagger文档）
export const apiPaths = {
  // 健康与统计
  '/api/v1/health': {
    get: {
      tags: ['系统'],
      summary: '健康检查',
      responses: {
        '200': { description: '服务正常' }
      }
    }
  },
  '/api/v1/regions/stats': {
    get: {
      tags: ['系统'],
      summary: '数据统计',
      responses: {
        '200': { description: '统计数据' }
      }
    }
  },
  
  // 行政区划
  '/api/v1/regions/provinces': {
    get: {
      tags: ['行政区划'],
      summary: '获取所有省级行政区',
      security: [{ ApiKeyAuth: [] }],
      responses: {
        '200': { description: '省级列表' },
        '401': { description: '未授权' }
      }
    }
  },
  '/api/v1/regions/cities/{code}': {
    get: {
      tags: ['行政区划'],
      summary: '获取省级下所有城市',
      security: [{ ApiKeyAuth: [] }],
      parameters: [
        { name: 'code', in: 'path', required: true, schema: { type: 'string' }, description: '省级代码（2位）' }
      ],
      responses: {
        '200': { description: '城市列表' },
        '404': { description: '未找到' }
      }
    }
  },
  '/api/v1/regions/districts/{code}': {
    get: {
      tags: ['行政区划'],
      summary: '获取城市下所有区县',
      security: [{ ApiKeyAuth: [] }],
      parameters: [
        { name: 'code', in: 'path', required: true, schema: { type: 'string' }, description: '城市代码（4位）' }
      ],
      responses: {
        '200': { description: '区县列表' }
      }
    }
  },
  '/api/v1/regions/streets/{code}': {
    get: {
      tags: ['行政区划'],
      summary: '获取区县下所有街道',
      security: [{ ApiKeyAuth: [] }],
      parameters: [
        { name: 'code', in: 'path', required: true, schema: { type: 'string' }, description: '区县代码（6位）' }
      ],
      responses: {
        '200': { description: '街道列表' }
      }
    }
  },
  '/api/v1/regions/children/{code}': {
    get: {
      tags: ['行政区划'],
      summary: '通用下级查询',
      security: [{ ApiKeyAuth: [] }],
      parameters: [
        { name: 'code', in: 'path', required: true, schema: { type: 'string' }, description: '行政区代码' }
      ],
      responses: {
        '200': { description: '下级行政区列表' }
      }
    }
  },
  '/api/v1/regions/search': {
    get: {
      tags: ['行政区划'],
      summary: '模糊搜索',
      security: [{ ApiKeyAuth: [] }],
      parameters: [
        { name: 'keyword', in: 'query', required: true, schema: { type: 'string' }, description: '搜索关键词' }
      ],
      responses: {
        '200': { description: '搜索结果' }
      }
    }
  },
  '/api/v1/regions/path/{code}': {
    get: {
      tags: ['行政区划'],
      summary: '获取完整路径',
      security: [{ ApiKeyAuth: [] }],
      parameters: [
        { name: 'code', in: 'path', required: true, schema: { type: 'string' }, description: '任意级别行政区代码' }
      ],
      responses: {
        '200': { description: '完整路径信息' }
      }
    }
  },
  
  // GeoJSON
  '/api/v1/geojson/provinces': {
    get: {
      tags: ['GeoJSON'],
      summary: '获取所有省级边界',
      security: [{ ApiKeyAuth: [] }],
      responses: {
        '200': { description: '省级边界列表' }
      }
    }
  },
  '/api/v1/geojson/provinces/{code}': {
    get: {
      tags: ['GeoJSON'],
      summary: '获取单个省级边界',
      security: [{ ApiKeyAuth: [] }],
      parameters: [
        { name: 'code', in: 'path', required: true, schema: { type: 'string' }, description: '省级代码（2位）' }
      ],
      responses: {
        '200': { description: '省级边界数据' }
      }
    }
  },
  
  // API Key管理
  '/api/v1/apikeys/keys': {
    get: {
      tags: ['API Key'],
      summary: '获取所有API Key',
      security: [{ ApiKeyAuth: [] }],
      responses: {
        '200': { description: 'API Key列表' }
      }
    },
    post: {
      tags: ['API Key'],
      summary: '创建新API Key',
      security: [{ ApiKeyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: '密钥名称' },
                rateLimit: { type: 'number', description: '速率限制' }
              }
            }
          }
        }
      },
      responses: {
        '201': { description: '创建成功' }
      }
    }
  },
  '/api/v1/apikeys/keys/{key}': {
    patch: {
      tags: ['API Key'],
      summary: '更新API Key状态',
      security: [{ ApiKeyAuth: [] }],
      parameters: [
        { name: 'key', in: 'path', required: true, schema: { type: 'string' } }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                active: { type: 'boolean' }
              }
            }
          }
        }
      },
      responses: {
        '200': { description: '更新成功' }
      }
    },
    delete: {
      tags: ['API Key'],
      summary: '删除API Key',
      security: [{ ApiKeyAuth: [] }],
      parameters: [
        { name: 'key', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        '200': { description: '删除成功' }
      }
    }
  },
  '/api/v1/apikeys/stats': {
    get: {
      tags: ['API Key'],
      summary: '获取API Key使用统计',
      security: [{ ApiKeyAuth: [] }],
      responses: {
        '200': { description: '统计数据' }
      }
    }
  },
  
  // 监控
  '/metrics': {
    get: {
      tags: ['监控'],
      summary: 'Prometheus指标',
      responses: {
        '200': { description: 'Prometheus格式指标' }
      }
    }
  },
  '/api/v1/cache/stats': {
    get: {
      tags: ['监控'],
      summary: '缓存统计',
      responses: {
        '200': { description: '缓存统计数据' }
      }
    }
  },
  '/api/v1/logs/stats': {
    get: {
      tags: ['监控'],
      summary: '日志统计',
      responses: {
        '200': { description: '日志统计数据' }
      }
    }
  },
  '/api/v1/logs/recent': {
    get: {
      tags: ['监控'],
      summary: '最近请求日志',
      responses: {
        '200': { description: '请求日志列表' }
      }
    }
  },
  '/api/v1/logs/alerts': {
    get: {
      tags: ['监控'],
      summary: '告警信息',
      responses: {
        '200': { description: '告警列表' }
      }
    }
  }
};

// 安全方案定义
export const securitySchemes = {
  ApiKeyAuth: {
    type: 'apiKey',
    in: 'header',
    name: 'x-api-key',
    description: 'API Key认证'
  }
};
