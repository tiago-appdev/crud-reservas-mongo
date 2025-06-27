# Sistema de Reservas para Restaurante - DevOps Integration

[![CI/CD Pipeline](https://github.com/tiago-appdev/crud-reservas-mongo/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/tiago-appdev/crud-reservas-mongo/actions/workflows/ci-cd.yml)
![Version](https://img.shields.io/github/v/release/tiago-appdev/crud-reservas-mongo)

Este proyecto es una aplicación web completa para la gestión de reservas en un restaurante. Permite a los usuarios registrarse, iniciar sesión, consultar disponibilidad de mesas, realizar reservas y gestionarlas. El sistema incluye un panel administrativo con reportes, autenticación basada en roles (cliente/admin), validaciones robustas y notificaciones por correo electrónico.

A nivel técnico, se integra un enfoque DevOps con CI/CD, Docker multi-stage, testing automatizado, monitoreo opcional con Prometheus/Grafana y despliegue continuo en plataformas como Render o mediante contenedores.

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Pug Views)   │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
│   Port: 3000    │    │   Express API   │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Health Check  │
                    │   /health       │
                    │   /ready        │
                    │   /live         │
                    └─────────────────┘
```

## 📋 Tabla de Contenidos

- [Tecnologías](#tecnologías)
- [Instalación y Configuración](#instalación-y-configuración)
- [Desarrollo Local](#desarrollo-local)
- [Docker & Containerización](#docker--containerización)
- [CI/CD Pipeline](#cicd-pipeline)
- [Deployment](#deployment)
- [Monitoreo y Health Checks](#monitoreo-y-health-checks)
- [Testing](#testing)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#troubleshooting)
- [Contribución](#-contribución)
- [Licencia](#-licencia)
- [Métricas del Proyecto](#-métricas-del-proyecto)
- [Conclusiones y Roles del Equipo](#conclusiones-y-roles-del-equipo)

## 🚀 Tecnologías

### Backend
- **Node.js 20+** - Entorno de ejecución
- **Express.js** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación
- **bcrypt** - Hash de contraseñas
- **Nodemailer** - Envío de emails

### Frontend
- **Pug** - Motor de plantillas
- **Bootstrap 5** - Framework CSS
- **Vanilla JavaScript** - Interactividad

### DevOps & Infrastructure
- **Docker** - Containerización
- **Docker Compose** - Orquestación local
- **GitHub Actions** - CI/CD
- **ESLint** - Linting de código
- **Jest** - Testing framework
- **Prometheus** - Monitoreo (opcional)
- **Grafana** - Dashboards (opcional)

## 📦 Instalación y Configuración

### Requisitos Previos

- [Node.js](https://nodejs.org/) 20+ y npm
- [Docker](https://docker.com/) y [Docker Compose](https://docs.docker.com/compose/)
- [Git](https://git-scm.com/)
- [MongoDB](https://mongodb.com/) (opcional para desarrollo local)

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tiago-appdev/crud-reservas-mongo.git
cd crud-reservas-mongo
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crear archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Configurar las variables necesarias:

```env
# Application
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key

# Database
MONGODB_URI=mongodb://localhost:27017/restaurant-reservations

# Email Service
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Deployment
DOMAIN=localhost
FRONTEND_URL=http://localhost:3000
```

### 4. Inicializar Base de Datos

```bash
# Ejecutar migraciones
npm run migrate

# Poblar con datos de ejemplo (opcional)
npm run seed
```

## 🛠️ Desarrollo Local
El proyecto ofrece dos formas principales para desarrollar y probar localmente:

### Método 1: Desarrollo Tradicional
En este método, se trabaja directamente con los servicios instalados en tu máquina:

- Ejecutar MongoDB localmente
- Iniciar la aplicación en modo desarrollo con `npm run dev`
- Ideal para debugging y desarrollo rápido sin contenedores

```bash
# Iniciar MongoDB localmente
mongod

# Ejecutar la aplicación en modo desarrollo
npm run dev
```

### Método 2: Con Docker Compose *(Recomendado)*
Este método utiliza Docker y Docker Compose para levantar todos los servicios (app, base de datos, etc.) en contenedores aislados, simulando un entorno de producción y facilitando la reproducibilidad.

- Construye y levanta contenedores para la app y MongoDB
- Permite agregar perfiles adicionales, como monitoreo con Prometheus y Grafana
- Uso de scripts npm para simplificar comandos Docker Compose

```bash
# Construir e iniciar todos los servicios
npm run docker:compose:up

# Ver logs en tiempo real
npm run docker:compose:logs

# Detener servicios
npm run docker:compose:down
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

### Usuarios de Prueba (después del seed)

```
Admin:
- Email: admin@restaurant.com
- Password: admin123

Clientes:
- Email: john@example.com
- Password: client123
```

## 🐳 Docker & Containerización

Esta sección explica en detalle la arquitectura Docker y comandos útiles para gestionar los contenedores.

### 🧱 Arquitectura de contenedores

- `app`: Contenedor principal con la aplicación Node.js
- `reservasdb`: Contenedor con MongoDB
- (Opcional) `prometheus` y `grafana` para monitoreo

### Dockerfile Multi-stage

El proyecto utiliza un Dockerfile multi-stage optimizado que incluye:

- **Base**: Alpine Linux + Node.js
- **Development**: Incluye herramientas necesarias para desarrollo local
- **Dependencies**: Solo dependencias de producción
- **Build**: Ejecuta linting y tests
- **Production**: Imagen final optimizada para despliegue

#### Comandos y tips Docker Compose.
Para facilitar la gestión, hay scripts npm que envuelven comandos Docker Compose:
```bash
# Levantar proyecto con build
docker-compose up --build -d

# Ver logs de todos los servicios
npm run docker:compose:logs

# Detener y eliminar contenedores, volúmenes y redes
npm run docker:compose:down

# Acceder a la consola del contenedor app
docker-compose exec app sh

# Ver estado y recursos de contenedores
docker-compose ps
docker stats
```

## ⚙️ CI/CD Pipeline

### GitHub Actions Workflow

El pipeline incluye:

1. **Test Stage**
   - Linting con ESLint
   - Tests unitarios con Jest
   - Coverage reporting
   - MongoDB en memoria para tests

2. **Build Stage**
   - Multi-platform Docker build (AMD64, ARM64)
   - Push a GitHub Container Registry
   - Versionado automático con tags

3. **Deploy Stages**
   - **Staging**: Deploy automático desde `develop`
   - **Production**: Deploy automático desde `main`

### Pipeline Diagram

```mermaid
graph LR
    A[Push/PR] --> B[Lint & Test]
    B --> C{Tests Pass?}
    C -->|Yes| D[Build Docker Image]
    C -->|No| E[❌ Fail]
    D --> F[Push to Registry]
    F --> G{Branch?}
    G -->|develop| H[Deploy to Staging]
    G -->|main| I[Deploy to Production]
    H --> J[✅ Staging Ready]
    I --> K[✅ Production Ready]
```

### Configurar GitHub Actions

1. Agregar secrets en GitHub:
   ```
   DOCKER_USERNAME
   DOCKER_PASSWORD
   MONGODB_URI (staging/prod)
   JWT_SECRET
   EMAIL_USER
   EMAIL_PASS
   ```

2. Habilitar GitHub Container Registry
3. Configurar environments (`production`)

## 🚀 Deployment


#### Render

1. Conectar repositorio de GitHub
2. Configurar variables de entorno
3. Deploy automático configurado en el CI/CD pipeline


## 📊 Monitoreo y Health Checks

### Health Check Endpoints

- **`/health`**: Status básico de la aplicación
- **`/health/detailed`**: Status detallado con DB y memoria
- **`/ready`**: Readiness probe para K8s
- **`/live`**: Liveness probe para K8s

### Ejemplo de Respuesta

```json
{
  "status": "OK",
  "timestamp": "2024-12-12T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "checks": {
    "database": "connected",
    "memory": {
      "used": "45.2 MB",
      "total": "128.0 MB",
      "usage": "35.3%",
      "status": "ok"
    }
  }
}
```

### Monitoreo con Prometheus (Opcional)

```bash
# Iniciar con monitoreo
docker-compose --profile monitoring up -d

# Acceder a dashboards
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001 (admin/admin)
```

## 🧪 Testing

### Estructura de Tests

```
src/tests/
├── setup.js                 # Configuración global
├── controllers/
│   ├── user.controllers.test.js
│   ├── reservation.controllers.test.js
│   ├── table.controllers.test.js
│   └── admin.controllers.test.js
└── playwright-tests/             
```

### Comandos de Testing

```bash
# Ejecutar todos los tests
npm test

# Tests en modo watch
npm run test:watch

# Coverage report
npm run test:coverage

# Tests para CI
npm run test:ci
```

### Coverage Goals

- **Statements**: > 80%
- **Branches**: > 70%
- **Functions**: > 80%
- **Lines**: > 80%

## 📚 API Documentation

### Autenticación

```bash
# Registro
POST /api/users/register
{
  "name": "Usuario",
  "email": "user@example.com", 
  "password": "password123"
}

# Login
POST /api/users/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Reservas

```bash
# Crear reserva
POST /api/reservations
Authorization: Cookie with JWT
{
  "table_id": "507f1f77bcf86cd799439011",
  "date": "2024-12-25",
  "time": "19:00",
  "guests": 4
}

# Obtener mis reservas
GET /api/reservations/my
Authorization: Cookie with JWT
```

### Mesas

```bash
# Buscar mesas disponibles
GET /api/tables/available?date=2024-12-25&time=19:00&party_size=4

# Crear mesa (admin)
POST /api/tables
Authorization: Cookie with JWT (admin role)
{
  "table_number": 1,
  "capacity": 4
}
```

### Admin Dashboard

```bash
# Dashboard data
GET /api/admin/dashboard
Authorization: Cookie with JWT (admin role)

# Reporte de ocupación
GET /api/admin/occupancy-report?startDate=2024-12-01&endDate=2024-12-31
Authorization: Cookie with JWT (admin role)
```

## 🔧 Troubleshooting

### Problemas Comunes

#### 1. Error de Conexión a MongoDB

```bash
# Verificar que MongoDB esté corriendo
docker-compose ps

# Ver logs de MongoDB
docker-compose logs reservasdb

# Reiniciar servicio
docker-compose restart reservasdb
```

#### 2. Tests Fallando

```bash
# Limpiar cache de Jest
npm test -- --clearCache

# Verificar variables de entorno
echo $NODE_ENV
```

#### 3. Build de Docker Fallando

```bash
# Limpiar build cache
docker system prune -a

# Build verbose
docker build --no-cache --progress=plain .
```

#### 4. Issues con Health Checks

```bash
# Verificar endpoints manualmente
curl http://localhost:3000/health
curl http://localhost:3000/ready

# Verificar logs de la aplicación
docker-compose logs app
```

### Logs y Debugging

```bash
# Ver logs en tiempo real
docker-compose logs -f app

# Debug específico de un servicio
docker-compose logs reservasdb

# Acceder al contenedor
docker-compose exec app sh

# Ver métricas del sistema
docker stats
```

## 🤝 Contribución

### Workflow de Desarrollo

1. **Fork** del repositorio
2. Crear **feature branch**: `git checkout -b feature/nueva-funcionalidad`
3. **Commits** con mensajes descriptivos
4. **Push** y crear **Pull Request**
5. Esperar **review** y **approval**

### Estándares de Código

- **ESLint** para JavaScript
- **Prettier** para formateo
- **Conventional Commits** para mensajes
- **Tests** obligatorios para nuevas funcionalidades

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo [LICENSE](./LICENSE) para más detalles.


## 📈 Métricas del Proyecto

- **Lines of Code**: ~2,500
- **Test Coverage**: 85%+
- **Docker Image Size**: <150MB
- **Build Time**: <5 minutes
- **Deployment Time**: <2 minutes

## Conclusiones y Roles del Equipo

Este proyecto nos permitió poner en práctica múltiples herramientas y conceptos vinculados al desarrollo moderno de software, integrando tanto aspectos técnicos como colaborativos. A lo largo del trabajo se abordaron buenas prácticas de desarrollo, despliegue automatizado, testing, monitoreo, documentación y trabajo en equipo.

Cada integrante del equipo contribuyó desde sus fortalezas, permitiendo un desarrollo equilibrado y ágil:

- [**Carolina Amarfil**](https://github.com/caroamarfil) – *Scrum Master & Documentación Técnica*: Facilitó las reuniones, organizó los tiempos y se encargó de mantener actualizada la documentación funcional y técnica. También apoyó tareas de testing y conexión entre frontend y backend.
- [**María Ozuna**](https://github.com/MariaOzuna) – *Diseño de Interfaz & UX*: Responsable del diseño visual de la aplicación y la experiencia de usuario. Su trabajo aseguró una interfaz clara y accesible.
- [**Tiago Ibarrola**](https://github.com/tiago-appdev) – *DevOps & Organización Técnica*: Estructuró el pipeline CI/CD, creó los scripts de automatización con Docker y GitHub Actions, y dio soporte técnico al equipo. También lideró la integración con servicios externos.
- [**Dario Skidelsky**](https://github.com/darioque) – *Backend Principal & Arquitectura*: Desarrolló gran parte de la lógica del backend y se ocupó de los endpoints, modelos y middleware. Su conocimiento técnico fue clave para resolver cuellos de botella.
- [**Maximiliano Pereyra**](https://github.com/maxip98) – *Frontend & Testing*: Implementó vistas en Pug y lógica de cliente en JS. Además, colaboró en la escritura de tests y ayudó a cubrir tareas faltantes en diferentes momentos del proyecto.

### Conclusión General

El enfoque DevOps nos permitió experimentar una forma moderna de construir, testear y desplegar software de forma colaborativa. Pudimos aplicar integración continua, testing automatizado, containerización y monitoreo, entendiendo el valor que aportan estas prácticas a proyectos reales. Más allá de los desafíos técnicos, logramos consolidar un producto funcional, bien documentado y desplegable en cualquier entorno.

