import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { uploadToOSS, generateSignedUrl } from '../services/oss';

const router = Router();

// 配置文件上传（本地临时存储，用于上传到 IPFS）
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 9 // 最多9张图片
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 JPG、PNG、GIF、WebP 格式的图片'));
    }
  }
});

// 上传图片到 OSS
router.post('/images', authMiddleware, upload.array('images', 9), async (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: '请选择要上传的图片' });
    }
    
    const uploadResults = [];
    
    for (const file of files) {
      try {
        // 上传到 OSS
        const result = await uploadToOSS(file.buffer, file.originalname, 'posts/');
        
        // 为图片生成签名URL（有效期1小时）
        const signedUrl = await generateSignedUrl(result.objectName, 3600);
        
        uploadResults.push({
          url: signedUrl, // 返回签名URL
          objectName: result.objectName, // 存储对象名，用于后续生成新的签名URL
          filename: file.originalname,
          size: file.size,
          storage: 'oss', // 标记存储类型
        });
      } catch (ossError) {
        console.error('OSS upload failed:', ossError);
        
        // 如果 OSS 上传失败，使用本地存储作为备选
        const ext = path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        
        const fs = await import('fs');
        const fsPath = await import('path');
        const uploadDir = fsPath.join(process.cwd(), 'uploads');
        
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const filePath = fsPath.join(uploadDir, filename);
        fs.writeFileSync(filePath, file.buffer);
        
        const baseUrl = process.env.BASE_URL || 'http://localhost:9091';
        
        uploadResults.push({
          url: `${baseUrl}/uploads/${filename}`,
          filename: file.originalname,
          size: file.size,
          storage: 'local', // 标记存储类型
        });
      }
    }
    
    res.json({
      success: true,
      files: uploadResults,
      storage: 'oss',
      message: '图片已上传到 OSS',
    });
  } catch (error) {
    console.error('上传图片错误:', error);
    res.status(500).json({ error: '上传失败' });
  }
});

// 上传单张图片（简化版）
router.post('/image', authMiddleware, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: '请选择要上传的图片' });
    }
    
    try {
      // 上传到 OSS
      const result = await uploadToOSS(file.buffer, file.originalname, 'avatars/');
      
      // 为图片生成签名URL（有效期1小时）
      const signedUrl = await generateSignedUrl(result.objectName, 3600);
      
      res.json({
        success: true,
        url: signedUrl,
        objectName: result.objectName,
        filename: file.originalname,
        size: file.size,
        storage: 'oss',
      });
    } catch (ossError) {
      console.error('OSS upload failed, using local fallback:', ossError);
      
      // 备选：本地存储
      const ext = path.extname(file.originalname);
      const filename = `${uuidv4()}${ext}`;
      
      const fs = await import('fs');
      const fsPath = await import('path');
      const uploadDir = fsPath.join(process.cwd(), 'uploads');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const filePath = fsPath.join(uploadDir, filename);
      fs.writeFileSync(filePath, file.buffer);
      
      const baseUrl = process.env.BASE_URL || 'http://localhost:9091';
      
      res.json({
        success: true,
        url: `${baseUrl}/uploads/${filename}`,
        filename: file.originalname,
        size: file.size,
        storage: 'local',
      });
    }
  } catch (error) {
    console.error('上传图片错误:', error);
    res.status(500).json({ error: '上传失败' });
  }
});

// 上传错误处理
router.use((error: any, req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '图片大小不能超过10MB' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: '最多只能上传9张图片' });
    }
    return res.status(400).json({ error: error.message });
  }
  
  if (error.message) {
    return res.status(400).json({ error: error.message });
  }
  
  return res.status(500).json({ error: '上传失败' });
});

export default router;
