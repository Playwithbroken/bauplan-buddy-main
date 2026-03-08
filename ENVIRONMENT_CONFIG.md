# Environment Configuration Guide

This document explains the environment configuration for the Bauplan Buddy application, including port settings, environment variables, and configuration options.

## Port Configuration

### Development Server Ports

The application uses the following port configuration:

- **Primary Development Port**: `8080` (configured in `vite.config.ts`)
- **Backend API Port**: `3001` (for API services)
- **Automatic Port Increment**: If port 8080 is occupied, Vite automatically tries 8081, 8082, etc.

### Port Usage History

Based on the project memory, different versions may have used different ports:

- Port 8080: Current version with modern sidebar layout
- Port 8081+: Automatic fallback ports when 8080 is occupied

### Accessing the Application

- **Local Development**: <http://localhost:8080>
- **Network Access**: <http://[your-ip]:8080> (shown in terminal when starting dev server)

## Environment Variables

The application supports the following environment variables:

### Development Variables

Create a `.env.local` file in the project root to override default settings:

```bash
# API Configuration
VITE_API_URL=http://localhost:3001/api
VITE_USE_API=false

# Backend Configuration  
VITE_USE_MOCK_BACKEND=true

# Development Mode (automatically set)
NODE_ENV=development
```

### Environment Variable Details

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3001/api` | Backend API base URL |
| `VITE_USE_API` | `false` | Enable real API calls (vs localStorage) |
| `VITE_USE_MOCK_BACKEND` | `true` | Use mock backend for development |
| `NODE_ENV` | `development` | Node environment mode |

### Production Variables

For production deployment, ensure these variables are properly set:

```bash
NODE_ENV=production
VITE_USE_API=true
VITE_API_URL=https://your-api-domain.com/api
VITE_USE_MOCK_BACKEND=false
```

## Configuration Files

### Vite Configuration (`vite.config.ts`)

```typescript
server: {
  host: "::",  // Allow IPv4 and IPv6 connections
  port: 8080,  // Fixed development port
}
```

### Development Commands

```bash
# Start development server on port 8080
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test
```

## Troubleshooting Port Issues

### Port Already in Use

If you see "Port 8080 is already in use", Vite will automatically:

1. Try port 8081
2. If occupied, try 8082
3. Continue incrementing until an available port is found

### Manual Port Override

To manually specify a different port:

```bash
# Option 1: Command line
npm run dev -- --port 3000

# Option 2: Environment variable
PORT=3000 npm run dev

# Option 3: Update vite.config.ts
server: {
  port: 3000
}
```

### Checking Active Ports

On Windows:

```bash
netstat -ano | findstr :8080
```

On macOS/Linux:

```bash
lsof -i :8080
```

## Network Configuration

### Host Settings

The current configuration (`host: "::"`) allows:

- Local access: `http://localhost:8080`
- Network access: `http://[your-ip]:8080`
- IPv6 support: `http://[::1]:8080`

### Firewall Considerations

Ensure port 8080 is allowed through your firewall for network access from other devices.

## Development vs Production

### Development Mode

- Uses mock backend by default
- Hot module replacement enabled
- Source maps available
- Detailed error messages

### Production Mode

- Optimized build
- Real API endpoints
- Compressed assets
- Error tracking enabled

## Related Documentation

- [FILTERING_TESTING_GUIDE.md](./FILTERING_TESTING_GUIDE.md) - Testing with development server
- [RECURRENCE_TESTING_GUIDE.md](./RECURRENCE_TESTING_GUIDE.md) - Calendar testing procedures
- [VALIDATION_CHECKLIST.md](./VALIDATION_CHECKLIST.md) - Development checklist