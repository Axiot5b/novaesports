# LoL Teams Manager

Aplicación web para gestionar equipos semiprofesionales de League of Legends, construida con Astro, Tailwind CSS y la API de Riot Games.

## Características

- Gestión de dos equipos semiprofesionales
- Seguimiento de estadísticas de jugadores
- Integración con la API de Riot Games
- Visualización de métricas de rendimiento
- Base de datos PostgreSQL serverless con Neon

## Configuración del Proyecto

### Prerrequisitos

- Node.js 18 o superior
- Cuenta de desarrollador de Riot Games
- Cuenta en Neon para la base de datos PostgreSQL
- Cuenta en Vercel para el despliegue

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
RIOT_API_KEY=tu_api_key_de_riot
POSTGRES_URL=tu_url_de_neon_db
DATABASE_URL=tu_url_de_neon_db
```

### Instalación

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Inicializar la base de datos:
   - Crea una nueva base de datos en Neon
   - Ejecuta el script de migración en `src/lib/migrations.sql`

3. Desarrollo local:
   ```bash
   npm run dev
   ```

## Estructura del Proyecto

- `/src/components`: Componentes reutilizables
- `/src/layouts`: Layouts de la aplicación
- `/src/pages`: Rutas y páginas
- `/src/lib`: Utilidades y configuración
- `/src/types`: Tipos de TypeScript

## Despliegue

1. Configurar variables de entorno en Vercel:
   - RIOT_API_KEY
   - POSTGRES_URL
   - DATABASE_URL

2. Vincular con GitHub y desplegar:
   ```bash
   vercel
   ```

## Actualización de Datos

Los datos de los jugadores se actualizan automáticamente usando la función `updateAllStats` en `src/lib/updateStats.ts`. Puedes configurar un cron job en Vercel para ejecutar esta actualización periódicamente.

## Licencia

MIT
