import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '中国行政区划API',
      version: '1.0.0',
      description: `
中国行政区划四级联动API服务

## 数据来源
中华人民共和国民政部截至2025年12月31日最新统计数据

## 认证方式
除公开接口外，所有接口需要通过 Header 传递 API Key：
\`\`\`
x-api-key: your_api_key
\`\`\`

## 公开接口（无需认证）
- GET /api/v1/health - 健康检查
- GET /api/v1/regions/stats - 数据统计

## 行政区划层级
- 第一级：省级（省/直辖市/自治区/特别行政区）
- 第二级：地级（地级市/自治州/盟）
- 第三级：区县（区/县/县级市）
- 第四级：乡级（街道/镇/乡/民族乡/苏木）
      `,
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:9091',
        description: '开发环境'
      },
      {
        url: 'https://api.example.com',
        description: '生产环境'
      }
    ],
    tags: [
      { name: '行政区划', description: '行政区划查询接口' },
      { name: '工具', description: '辅助功能接口' }
    ],
    paths: {
      '/api/v1/regions/provinces': {
        get: {
          tags: ['行政区划'],
          summary: '获取省级列表',
          description: '返回全国34个省级行政区划',
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: { type: 'integer', example: 200 },
                      message: { type: 'string', example: 'success' },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            code: { type: 'string', description: '行政区划代码' },
                            name: { type: 'string', description: '行政区划名称' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/regions/cities/{code}': {
        get: {
          tags: ['行政区划'],
          summary: '获取城市列表',
          description: '根据省级代码获取下级城市列表',
          parameters: [
            {
              name: 'code',
              in: 'path',
              required: true,
              description: '省级代码（前2位）',
              schema: { type: 'string', example: '71' }
            }
          ],
          responses: {
            '200': {
              description: '成功'
            }
          }
        }
      },
      '/api/v1/regions/districts/{code}': {
        get: {
          tags: ['行政区划'],
          summary: '获取区县列表',
          description: '根据城市代码获取下级区县列表',
          parameters: [
            {
              name: 'code',
              in: 'path',
              required: true,
              description: '城市代码（前4位）',
              schema: { type: 'string', example: '7101' }
            }
          ],
          responses: {
            '200': {
              description: '成功'
            }
          }
        }
      },
      '/api/v1/regions/streets/{code}': {
        get: {
          tags: ['行政区划'],
          summary: '获取街道列表',
          description: '根据区县代码获取下级街道/镇/乡列表',
          parameters: [
            {
              name: 'code',
              in: 'path',
              required: true,
              description: '区县代码（前6位）',
              schema: { type: 'string', example: '710101' }
            }
          ],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            code: { type: 'string' },
                            name: { type: 'string' },
                            type: { type: 'string', description: '类型：街道/镇/乡/民族乡/苏木' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/regions/children/{code}': {
        get: {
          tags: ['行政区划'],
          summary: '通用下级查询',
          description: '根据任意层级代码自动识别并返回下级数据',
          parameters: [
            {
              name: 'code',
              in: 'path',
              required: true,
              description: '行政区划代码',
              schema: { type: 'string', example: '71' }
            }
          ],
          responses: {
            '200': {
              description: '成功'
            }
          }
        }
      },
      '/api/v1/regions/search': {
        get: {
          tags: ['行政区划'],
          summary: '模糊搜索',
          description: '在所有行政区划中搜索匹配关键词的数据',
          parameters: [
            {
              name: 'keyword',
              in: 'query',
              required: true,
              description: '搜索关键词',
              schema: { type: 'string', example: '北京' }
            }
          ],
          responses: {
            '200': {
              description: '成功'
            }
          }
        }
      },
      '/api/v1/regions/path/{code}': {
        get: {
          tags: ['行政区划'],
          summary: '完整路径查询',
          description: '根据任意层级代码返回完整的省-市-区-街路径',
          parameters: [
            {
              name: 'code',
              in: 'path',
              required: true,
              description: '行政区划代码',
              schema: { type: 'string', example: '110101' }
            }
          ],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          province: { type: 'object', description: '省级信息' },
                          city: { type: 'object', description: '城市信息' },
                          district: { type: 'object', description: '区县信息' },
                          street: { type: 'object', description: '街道信息' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/regions/stats': {
        get: {
          tags: ['行政区划'],
          summary: '数据统计',
          description: '返回当前系统行政区划数据统计（公开接口，无需认证）',
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          provinces: { type: 'integer', description: '省级数量' },
                          cities: { type: 'integer', description: '城市数量' },
                          districts: { type: 'integer', description: '区县数量' },
                          streets: { type: 'integer', description: '街道数量' },
                          streetTypes: {
                            type: 'object',
                            description: '街道类型统计',
                            properties: {
                              街道: { type: 'integer' },
                              镇: { type: 'integer' },
                              乡: { type: 'integer' },
                              民族乡: { type: 'integer' },
                              苏木: { type: 'integer' }
                            }
                          },
                          lastUpdated: { type: 'string', description: '数据更新时间' },
                          dataSource: { type: 'string', description: '数据来源' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/health': {
        get: {
          tags: ['工具'],
          summary: '健康检查',
          description: '检查服务是否正常运行（公开接口，无需认证）',
          responses: {
            '200': {
              description: '服务正常'
            }
          }
        }
      }
    }
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
