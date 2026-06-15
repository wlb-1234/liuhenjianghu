// 统一错误处理中间件
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 错误码枚举
export const ErrorCode = {
  // 400xx - 客户端错误
  BAD_REQUEST: 40000,
  UNAUTHORIZED: 40100,
  FORBIDDEN: 40300,
  NOT_FOUND: 40400,
  CONFLICT: 40900,
  
  // 500xx - 服务端错误
  INTERNAL_ERROR: 50000,
  DATABASE_ERROR: 50010,
  EXTERNAL_SERVICE_ERROR: 50020,
};

// 错误处理中间件
export const errorHandler = (err: any, req: any, res: any, next: any) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || '服务器内部错误';
  const code = err.code || ErrorCode.INTERNAL_ERROR;

  // 记录错误日志
  console.error('========== ERROR ==========');
  console.error(`时间: ${new Date().toISOString()}`);
  console.error(`路径: ${req.method} ${req.originalUrl}`);
  console.error(`状态码: ${statusCode}`);
  console.error(`错误码: ${code}`);
  console.error(`消息: ${message}`);
  console.error(`用户ID: ${req.user?.userId || 'anonymous'}`);
  console.error('Stack:', err.stack);
  console.error('==========================');

  // 生产环境不返回 stack
  const response: any = {
    success: false,
    message,
    code,
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

// 404 处理（普通中间件，接受3个参数）
export const notFoundHandler = (req: any, res: any, _next: any) => {
  res.status(404).json({
    success: false,
    message: `路由 ${req.method} ${req.originalUrl} 不存在`,
    code: ErrorCode.NOT_FOUND,
  });
};

// 异步错误包装
export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
