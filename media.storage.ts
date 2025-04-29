import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

export const mediaStorage = diskStorage({
  destination: (req, file, cb) => {
    const tmpPath = './uploads/tmp';
    fs.mkdirSync(tmpPath, { recursive: true });
    cb(null, tmpPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});
