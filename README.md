# FlowMint Sistema

FlowMint es un sistema de gestión de turnos completo con funcionalidades de backend y frontend.

## Características

- Gestión de turnos
- Gestión de clientes
- Gestión de empleados
- Gestión de servicios
- Reportes de ganancias
- Asistente de IA con soporte dual (Groq y Cerebras)

## Tecnologías

- Backend: NestJS, PostgreSQL, Prisma
- Frontend: React, Vite
- IA: Soporte dual para Groq y Cerebras con fallback automático

## Instalación

1. Clona el repositorio
2. Instala las dependencias:
   - Backend: `cd FlowMint-backend-nestjs && npm install`
   - Frontend: `cd FlowMint-frontend && npm install`
3. Configura las variables de entorno
4. Inicia los servicios

## Configuración de IA

Para usar las funcionalidades de IA, necesitas configurar tus propias claves API en los archivos `.env`:

- `GROQ_API_KEY`: Tu clave de API de Groq
- `CEREBRAS_API_KEY`: Tu clave de API de Cerebras

Los placeholders ya están configurados en los archivos `.env` correspondientes.

## Licencia

MIT
