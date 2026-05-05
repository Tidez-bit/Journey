# Journey Trading Journal - Docker Quick Start

## 🚀 Quick Commands

### Start Everything
```bash
docker compose up -d --build
```

### Start Client Only (after backend is running)
```bash
docker compose up -d --build client
```

### View Logs
```bash
# All services
docker compose logs -f

# Client only
docker logs -f journey-client

# Server only
docker logs -f journey-server

# Database only
docker logs -f journey-db
```

### Stop Everything
```bash
docker compose down
```

### Restart a Service
```bash
docker compose restart client
docker compose restart server
docker compose restart db
```

---

## 🌐 Access Points

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **Database:** localhost:3307 (MySQL)

---

## 🔧 Troubleshooting

### Frontend can't connect to backend?

1. **Check environment variables in browser console:**
```javascript
console.log(import.meta.env.VITE_API_URL)
// Should output: "http://localhost:5000/api"
```

2. **Check .env file exists:**
```bash
docker exec journey-client cat /app/.env
```

3. **Rebuild client:**
```bash
docker compose up -d --build client
```

### Database connection issues?

1. **Check database is healthy:**
```bash
docker compose ps
# journey-db should show "healthy"
```

2. **Check database logs:**
```bash
docker logs journey-db
```

3. **Restart database:**
```bash
docker compose restart db
```

### Backend not starting?

1. **Check server logs:**
```bash
docker logs journey-server
```

2. **Check database connection:**
```bash
docker exec journey-server env | grep DATABASE_URL
```

3. **Run migrations:**
```bash
docker exec journey-server npx prisma migrate deploy
```

---

## 📝 Environment Variables

### Client (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
```

### Server (docker-compose.yml)
```yaml
DATABASE_URL: "mysql://journey:journey123@db:3306/journey"
JWT_SECRET: "your-super-secret-jwt-key-change-this"
NODE_ENV: development
PORT: 5000
CLIENT_URL: "http://localhost:5173"
```

---

## 🗄️ Database Management

### Access MySQL CLI
```bash
docker exec -it journey-db mysql -u journey -pjourney123 journey
```

### Run Prisma Migrations
```bash
docker exec journey-server npx prisma migrate deploy
```

### Reset Database (⚠️ Deletes all data)
```bash
docker compose down -v
docker compose up -d --build
```

---

## 🔄 Common Workflows

### After Code Changes

**Frontend changes:**
```bash
# Hot reload works automatically, no restart needed
# If issues persist:
docker compose restart client
```

**Backend changes:**
```bash
docker compose restart server
```

**Database schema changes:**
```bash
# 1. Update schema.prisma
# 2. Create migration
docker exec journey-server npx prisma migrate dev --name your_migration_name
# 3. Restart server
docker compose restart server
```

### Fresh Start
```bash
# Stop everything and remove volumes
docker compose down -v

# Rebuild and start
docker compose up -d --build

# Wait for database to be healthy (check with docker compose ps)
# Then run migrations if needed
docker exec journey-server npx prisma migrate deploy
```

---

## 📊 Health Checks

### Check all services status
```bash
docker compose ps
```

Expected output:
```
NAME                IMAGE           STATUS
journey-client      journey-client  Up
journey-server      journey-server  Up
journey-db          mysql:8.0       Up (healthy)
```

### Test API endpoint
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{"status":"ok","message":"Journey API is running"}
```

### Test frontend
```bash
curl http://localhost:5173
```

Should return HTML content.

---

## 🐛 Debug Mode

### Enter container shell

**Client:**
```bash
docker exec -it journey-client sh
```

**Server:**
```bash
docker exec -it journey-server sh
```

**Database:**
```bash
docker exec -it journey-db bash
```

### Check files inside container

**Check .env in client:**
```bash
docker exec journey-client cat /app/.env
```

**Check server files:**
```bash
docker exec journey-server ls -la /app
```

---

## 🔐 Security Notes

### Development (Current)
- Default passwords are used
- JWT secret is hardcoded
- Database exposed on host port 3307
- **DO NOT use in production**

### Production Recommendations
- Use Docker secrets
- Use environment-specific .env files
- Don't expose database port
- Use strong, random JWT secret
- Enable HTTPS
- Use production-grade database

---

## 📦 Volumes

### Persistent Data
```yaml
volumes:
  db_data:              # MySQL data
  ./server/uploads      # Uploaded screenshots
  ./server/logs         # Application logs
```

### Clear all data
```bash
docker compose down -v
```

---

## 🎯 Testing Checklist

After starting with `docker compose up -d --build`:

- [ ] All containers are running (`docker compose ps`)
- [ ] Database is healthy
- [ ] Frontend accessible at http://localhost:5173
- [ ] Backend API responds at http://localhost:5000/api/health
- [ ] Can register new user
- [ ] Can login
- [ ] Dashboard loads
- [ ] Can create trade
- [ ] No console errors

---

## 📞 Support

If issues persist:

1. Check logs: `docker compose logs -f`
2. Verify environment variables
3. Try fresh start: `docker compose down -v && docker compose up -d --build`
4. Check documentation: `DOCKER-ENV-FIX-COMPLETE.md`

---

**Last Updated:** May 5, 2026  
**Docker Compose Version:** 3.8  
**Node Version:** 20-alpine  
**MySQL Version:** 8.0
