# 🚀 Hướng dẫn Deploy Foodbook

## Tổng quan
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: MySQL (có thể dùng PlanetScale, Railway, hoặc AWS RDS)

## Bước 1: Chuẩn bị Database

### Tùy chọn 1: PlanetScale (Khuyến nghị - Free tier tốt)
1. Đăng ký tài khoản tại [PlanetScale](https://planetscale.com)
2. Tạo database mới
3. Import schema từ `server/db/nhanmmo.sql`
4. Lấy connection string

### Tùy chọn 2: Railway
1. Đăng ký tại [Railway](https://railway.app)
2. Tạo MySQL database
3. Import schema

### Tùy chọn 3: AWS RDS hoặc DigitalOcean
Tương tự như trên

## Bước 2: Deploy Backend lên Render

### 2.1 Chuẩn bị
1. Push code lên GitHub repository
2. Đăng ký tài khoản [Render](https://render.com)

### 2.2 Deploy
1. **Connect to GitHub**:
   - Vào Render Dashboard
   - Click "New +" → "Web Service"
   - Connect GitHub repo → Chọn repository

2. **Cấu hình Service**:
   - **Name**: `foodbook-api`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

3. **Environment Variables**:
   ```
   NODE_ENV=production
   DB_HOST=your_database_host
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_NAME=your_database_name
   JWT_SECRET=your_random_jwt_secret_32_chars_min
   PORT=10000
   ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
   ```

   *(Thay thế các giá trị thực tế)*

4. **Deploy**: Click "Create Web Service"

### 2.3 Lấy API URL
Sau khi deploy thành công, copy URL của Render service (vd: `https://foodbook-api.onrender.com`)

## Bước 3: Deploy Frontend lên Vercel

### 3.1 Chuẩn bị
1. Đăng ký tài khoản [Vercel](https://vercel.com)
2. Connect GitHub repository

### 3.2 Cập nhật cấu hình
1. **Sửa `client/vercel.json`**:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "devCommand": "npm run dev",
     "framework": "vite",
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "https://your-render-api-url.onrender.com/api/$1"
       }
     ]
   }
   ```

2. **Tạo `client/.env.local`**:
   ```
   VITE_API_URL=https://your-render-api-url.onrender.com
   ```

### 3.3 Deploy
1. **Import Project**:
   - Vào Vercel Dashboard
   - Click "New Project"
   - Import từ GitHub

2. **Cấu hình Build**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Environment Variables**:
   ```
   VITE_API_URL=https://your-render-api-url.onrender.com
   ```

4. **Deploy**: Click "Deploy"

## Bước 4: Cập nhật Backend CORS (quan trọng!)

Sau khi có Vercel URL, cập nhật `ALLOWED_ORIGINS` trong Render:

```
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

## Bước 5: Test Deployment

1. **Test Frontend**: Truy cập Vercel URL
2. **Test API**: Truy cập `https://your-render-api.onrender.com/`
3. **Test Login/Register**: Đăng ký tài khoản mới
4. **Test Posts**: Tạo bài viết

## Troubleshooting

### ❌ Lỗi CORS
- Kiểm tra `ALLOWED_ORIGINS` trong Render có đúng Vercel URL không
- Đảm bảo không có dấu `/` ở cuối URL

### ❌ API calls fail
- Kiểm tra `VITE_API_URL` trong Vercel có đúng Render URL không
- Kiểm tra Render service có chạy không (logs)

### ❌ Database connection
- Kiểm tra tất cả DB environment variables
- Đảm bảo database cho phép remote connections

### ❌ Build fails
- Kiểm tra dependencies trong package.json
- Xem build logs trong Vercel/Render dashboard

## Performance Tips

### Frontend (Vercel)
- Enable Vercel Analytics để monitor performance
- Sử dụng Vercel Edge Functions nếu cần

### Backend (Render)
- Chọn instance type phù hợp (Free tier: 750h/month)
- Monitor usage để tránh exceed limits
- Sử dụng Redis nếu cần caching

## URLs sau khi deploy
- **Frontend**: `https://your-project.vercel.app`
- **Backend**: `https://foodbook-api.onrender.com`
- **API Base**: `https://foodbook-api.onrender.com/api`

## Cập nhật Production
1. Push code changes lên GitHub
2. Vercel tự động redeploy frontend
3. Render tự động redeploy backend (hoặc manual trigger)

## Chi phí
- **Vercel**: Free tier đủ dùng cho hobby projects
- **Render**: Free tier 750h/month (~$7/month nếu exceed)
- **Database**: PlanetScale free tier, Railway ~$5/month

---
🎉 **Chúc mừng! Ứng dụng đã được deploy thành công!**