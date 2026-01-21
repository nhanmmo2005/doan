# Foodbook

Ứng dụng chia sẻ review nhà hàng và kết nối cộng đồng ẩm thực.

## Cài đặt

1. Clone repository
2. Cài đặt dependencies:
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```

3. Cấu hình database:
   - Import file `server/db/nhanmmo.sql` vào MySQL
   - Tạo file `.env` trong thư mục server:

   ```env
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_NAME=foodbook
   DB_PASSWORD=your_db_password
   JWT_SECRET=your_random_jwt_secret
   PORT=5000
   ```

## Chạy development

```bash
# Terminal 1: Server
cd server && npm run dev

# Terminal 2: Client
cd client && npm run dev
```

## Deploy lên production

### 1. Build client
```bash
cd client && npm run build
```

### 2. Serve client files từ server
Trong production, server cần serve static files của client. Thêm vào `server/index.js`:

```javascript
// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/dist')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
```

### 3. Cấu hình reverse proxy (Nginx example)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Serve API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve React app
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Environment Variables
Tạo file `.env` trong thư mục server với thông tin database production.

## Lưu ý
- Client tự động detect environment: localhost cho dev, `/api` cho production
- Đảm bảo CORS được cấu hình đúng trong production
- Database cần được backup thường xuyên