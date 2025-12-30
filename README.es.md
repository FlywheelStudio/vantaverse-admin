# Flywheel Starter - Next.js + Supabase

**[English](README.md) | Español**

Una plantilla moderna y lista para producción para construir aplicaciones web escalables con Next.js 16, Supabase y TypeScript. Este starter proporciona una base sólida con autenticación, integración de base de datos, componentes UI y mejores prácticas para desarrollo profesional.

## 🚀 Stack Tecnológico

### Framework Principal

- **Frontend**: Next.js 16.1.1 con App Router
- **Lenguaje**: TypeScript 5.x
- **Base de Datos y Backend**: Supabase (PostgreSQL + Auth)
- **Runtime**: Node.js 22.x
- **Gestor de Paquetes**: pnpm 10.x

### UI y Sistema de Diseño

- **Componentes**: ShadCN UI construido sobre primitivos de Radix UI
- **Estilos**: Tailwind CSS 4.x
- **Animaciones**: tw-animate-css para transiciones suaves
- **Iconos**: Lucide React
- **Temas**: Next Themes con soporte para modo oscuro/claro

### Herramientas de Desarrollo y Calidad

- **Linting**: ESLint con configuración de Next.js
- **Formateo**: Prettier para estilo de código consistente
- **Git Hooks**: Husky para validación pre-commit
- **Commits**: Commitlint con Conventional Commits
- **Código Muerto**: Knip para detección de dependencias no utilizadas
- **Releases**: Release-it con changelog convencional

## ✨ Características Principales

### 🔐 **Autenticación Lista**

- Integración completa de Supabase Auth
- Autenticación del lado del servidor y cliente
- Rutas protegidas y middleware
- Gestión de sesiones con cookies
- Cliente anónimo para datos públicos

### 🎨 **Componentes UI Modernos**

- Componentes ShadCN UI preconfigurados
- Soporte para tema oscuro/claro
- Utilidades de diseño responsivo
- Hook de detección móvil
- Componentes accesibles (Radix UI)

### 📦 **Integración con Supabase**

- Múltiples configuraciones de cliente (cliente, servidor, anónimo)
- **Patrón RPC** para operaciones de base de datos (recomendado)
- Funciones PostgreSQL para lógica de negocio
- Soporte para suscripciones en tiempo real
- Utilidades de almacenamiento
- Consultas y schemas con type-safe

### 🛠️ **Experiencia de Desarrollador**

- TypeScript modo estricto
- Importaciones absolutas con alias de ruta
- Hot module replacement
- ESLint y Prettier configurados
- Git hooks para calidad de código
- Releases automatizados con changelog

## 📁 Estructura del Proyecto

```
nextjs-supabase/
├── src/                           # Código fuente
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx            # Layout raíz con providers
│   │   ├── page.tsx              # Página principal
│   │   └── globals.css           # Estilos globales
│   │
│   ├── components/               # Componentes React
│   │   ├── ui/                   # Componentes ShadCN UI
│   │   │   ├── button.tsx        # Componente Button
│   │   │   └── alert.tsx         # Componente Alert
│   │   └── common/               # Componentes comunes
│   │
│   ├── context/                  # Providers de React Context
│   │   ├── auth.tsx              # Contexto de autenticación
│   │   └── theme.tsx             # Contexto de tema
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-auth.ts           # Hook de autenticación
│   │   ├── use-mobile.ts         # Hook de detección móvil
│   │   └── use-theme.ts          # Hook de gestión de tema
│   │
│   ├── lib/                      # Funciones utilitarias y configs
│   │   ├── supabase/             # Configuración de cliente Supabase
│   │   │   ├── core/             # Implementaciones de cliente
│   │   │   │   ├── client.ts     # Cliente del navegador
│   │   │   │   ├── server.ts     # Cliente del servidor
│   │   │   │   └── anonymous.ts  # Cliente anónimo
│   │   │   ├── queries/          # Consultas de base de datos
│   │   │   ├── schemas/          # Esquemas de datos
│   │   │   ├── realtimes/        # Suscripciones en tiempo real
│   │   │   ├── query.ts          # Query builder
│   │   │   ├── realtime.ts       # Utilidades de realtime
│   │   │   └── storage.ts        # Utilidades de almacenamiento
│   │   ├── utils.ts              # Utilidades comunes
│   │   └── proxy.ts              # Utilidades de proxy
│   │
│   └── services/                 # Lógica de negocio
│
├── public/                       # Assets estáticos
│
├── docs/                         # Documentación
│   ├── ARCHITECTURE.md          # Guía de arquitectura
│   ├── SUPABASE.md              # Guía de integración Supabase
│   ├── HOOKS.md                 # Documentación de hooks
│   ├── UI_COMPONENTS.md         # Guía de componentes UI
│   └── GIT_WORKFLOW.md          # Git workflow y releases
│
├── .husky/                       # Configuración de Git hooks
│   ├── commit-msg                # Validación de mensaje de commit
│   ├── pre-commit                # Linting pre-commit
│   └── pre-push                  # Validación pre-push
│
└── Archivos de configuración     # ESLint, Prettier, TypeScript, etc.
```

## 📚 Documentación

Para guías detalladas y detalles de implementación, consulta el [directorio de documentación](./docs/):

- **[Primeros Pasos](./docs/GETTING_STARTED.md)** - Guía rápida de inicio y configuración
- **[Arquitectura](./docs/ARCHITECTURE.md)** - Arquitectura del proyecto y patrones
- **[Integración Supabase](./docs/SUPABASE.md)** - Configuración de base de datos y auth
- **[Hooks Personalizados](./docs/HOOKS.md)** - Hooks disponibles y uso
- **[Componentes UI](./docs/UI_COMPONENTS.md)** - Guía de componentes ShadCN UI
- **[Flujo de Trabajo Git](./docs/GIT_WORKFLOW.md)** - Commits, releases y convenciones
- **[Contribuir](./CONTRIBUTING.md)** - Cómo contribuir a este proyecto

## 🚀 Inicio Rápido

### Prerrequisitos

- **Node.js**: 22.x o superior
- **pnpm**: 10.x (recomendado) o npm/yarn
- **Cuenta Supabase**: Crea una en [supabase.com](https://supabase.com)
- **Git**: Para control de versiones

### Instalación

```bash
# 1. Clona el repositorio
git clone https://github.com/your-org/nextjs-supabase-starter.git
cd nextjs-supabase-starter

# 2. Instala dependencias
pnpm install

# 3. Configura variables de entorno
cp .env.example .env.local

# Edita .env.local con tus credenciales de Supabase:
# NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
# NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_supabase
```

### Obtén tus Credenciales de Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Ve a **Configuración del Proyecto** → **API**
4. Copia tu **URL del Proyecto** y **clave anon/public**
5. Pégalas en tu archivo `.env.local`

### Ejecuta el Servidor de Desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) para ver tu aplicación.

### Configura Git Hooks

```bash
pnpm prepare
```

Esto inicializará Husky para git hooks (commit-msg, pre-commit, pre-push).

## 🔧 Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Inicia servidor de desarrollo (localhost:3000)
pnpm start            # Inicia servidor de producción

# Calidad de Código
pnpm lint             # Ejecuta verificaciones ESLint
pnpm format:check     # Verifica formateo de código
pnpm format:write     # Formatea código con Prettier
pnpm knip             # Encuentra dependencias y exports no utilizados

# Git y Release
pnpm commitlint       # Valida mensajes de commit
pnpm release          # Crea un nuevo release con changelog
pnpm prepare          # Configura git hooks de Husky
```

## 🎨 Usando Componentes ShadCN UI

Este starter viene con ShadCN UI preconfigurado. Agrega nuevos componentes:

```bash
npx shadcn@latest add [nombre-componente]
```

Ejemplo:

```bash
# Agregar un componente card
npx shadcn@latest add card

# Agregar múltiples componentes
npx shadcn@latest add dialog sheet tabs
```

Componentes disponibles: button, card, dialog, sheet, tabs, input, form, y [muchos más](https://ui.shadcn.com/docs/components).

## 🔐 Autenticación

El starter incluye una configuración completa de autenticación usando Supabase Auth:

```typescript
// Componente cliente
import { useAuth } from '@/hooks/use-auth';

function MiComponente() {
  const { user, session, isLoading, signOut } = useAuth();

  if (isLoading) return <div>Cargando...</div>;
  if (!user) return <div>No autenticado</div>;

  return (
    <div>
      <p>Bienvenido, {user.email}</p>
      <button onClick={signOut}>Cerrar Sesión</button>
    </div>
  );
}
```

Consulta la [Guía de Integración Supabase](./docs/SUPABASE.md) para más detalles.

## 🎭 Gestión de Temas

Alterna entre temas claro y oscuro:

```typescript
import { useTheme } from '@/hooks/use-theme';

function ThemeToggle() {
  const { theme, toggleTheme, setTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      Tema actual: {theme}
    </button>
  );
}
```

## 📱 Diseño Responsivo

Detecta dispositivos móviles:

```typescript
import { useIsMobile } from '@/hooks/use-mobile';

function ComponenteResponsivo() {
  const isMobile = useIsMobile();

  return (
    <div>
      {isMobile ? <VistaMóvil /> : <VistaEscritorio />}
    </div>
  );
}
```

## 🗄️ Integración con Base de Datos

### Patrón RPC (Recomendado)

**Mejor Práctica:** Usa funciones PostgreSQL con RPC en lugar de consultas directas para mejor seguridad y rendimiento.

```sql
-- Crear una función PostgreSQL en el Editor SQL de Supabase
CREATE OR REPLACE FUNCTION get_user_notes(p_user_id uuid)
RETURNS TABLE (
  id bigint,
  title text,
  content text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT n.id, n.title, n.content, n.created_at
  FROM notes n
  WHERE n.user_id = p_user_id
  ORDER BY n.created_at DESC;
END;
$$;
```

**Llamar la función desde TypeScript:**

```typescript
import { createClient } from '@/lib/supabase/core/server';

async function obtenerNotasUsuario(userId: string) {
  const supabase = await createClient();

  // Llamar función RPC (recomendado)
  const { data, error } = await supabase.rpc('get_user_notes', {
    p_user_id: userId,
  });

  if (error) throw error;
  return data;
}
```

**¿Por qué RPC?**

- ✅ Mejor seguridad (lógica permanece en el servidor)
- ✅ Mejor rendimiento (operaciones complejas se ejecutan en la base de datos)
- ✅ Más fácil de mantener y probar
- ✅ Reutilizable en diferentes clientes

### Suscripciones en Tiempo Real

```typescript
import { supabase } from '@/lib/supabase/core/client';

const canal = supabase
  .channel('cambios-tabla')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'tu_tabla' },
    (payload) => console.log('¡Cambio recibido!', payload),
  )
  .subscribe();
```

**Aprende más:** Consulta la [Guía de Integración Supabase](./docs/SUPABASE.md) para ejemplos completos de RPC y mejores prácticas.

## 🔄 Flujo de Trabajo Git

Este starter sigue **Conventional Commits** con validación automatizada:

### Formato de Mensaje de Commit

```
tipo(alcance): asunto

cuerpo (opcional)

pie (opcional)
```

### Tipos Permitidos

- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `hotfix`: Corrección crítica de bug
- `chore`: Tarea de mantenimiento
- `docs`: Cambios en documentación
- `style`: Cambios de estilo de código (formateo)
- `test`: Agregar o actualizar tests
- `ci`: Cambios en CI/CD

### Ejemplos

```bash
# Buenos commits
git commit -m "feat: agregar autenticación de usuario"
git commit -m "fix: resolver problema de navegación en móvil"
git commit -m "docs: actualizar README con instrucciones de setup"

# Malos commits (serán rechazados)
git commit -m "cosas actualizadas"
git commit -m "WIP"
```

**Longitud máxima**: 120 caracteres

### Git Hooks

- **commit-msg**: Valida formato de mensaje de commit
- **pre-commit**: Ejecuta ESLint en archivos staged
- **pre-push**: Ejecuta validación adicional

## 📦 Crear Releases

Este starter usa `release-it` para releases automatizados:

```bash
# Crear un nuevo release
pnpm release

# Qué sucede:
# 1. Ejecuta linting (ESLint)
# 2. Ejecuta detección de código no usado (Knip)
# 3. Incrementa versión basándose en commits
# 4. Genera/actualiza CHANGELOG.md
# 5. Crea commit y tag de git
# 6. Push al repositorio
# 7. Crea release en GitHub
```

### Incremento de Versión

La versión se determina automáticamente de tus commits:

- `feat:` → Incremento menor (0.1.0 → 0.2.0)
- `fix:` → Incremento de parche (0.1.0 → 0.1.1)
- `feat!:` o `BREAKING CHANGE:` → Incremento mayor (0.1.0 → 1.0.0)

### Token de GitHub Release

Para crear releases en GitHub, agrega un personal access token:

```bash
# Agregar al entorno
export RELEASE_GIT=tu_token_github

# O agregar a .env.local
RELEASE_GIT=tu_token_github
```

## 🚀 Despliegue

### Vercel (Recomendado)

1. Sube tu código a GitHub
2. Importa proyecto en [Vercel](https://vercel.com)
3. Agrega variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. ¡Despliega!

### Otras Plataformas

Este starter se puede desplegar en cualquier plataforma que soporte Next.js:

- **Netlify**: [Guía de despliegue](https://docs.netlify.com/integrations/frameworks/next-js/)
- **Railway**: [Guía de despliegue](https://docs.railway.app/guides/nextjs)
- **AWS Amplify**: [Guía de despliegue](https://docs.amplify.aws/nextjs/)

## 🤝 Contribuir

¡Damos la bienvenida a contribuciones! Por favor consulta [CONTRIBUTING.md](./CONTRIBUTING.md) para:

- Código de Conducta
- Flujo de trabajo de desarrollo
- Proceso de pull request
- Estándares de código

## 🐛 Issues y Soporte

- **Reportes de Bugs**: [Abre un issue](https://github.com/your-org/repo/issues)
- **Solicitudes de Funcionalidades**: [Abre una discusión](https://github.com/your-org/repo/discussions)
- **Preguntas**: [Únete a nuestro Discord](https://discord.gg/your-invite)

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - consulta el archivo [LICENSE](./LICENSE) para más detalles.

## 👥 Autores

**Flywheel Studio**  
Ender Puentes <endpuent@gmail.com>

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) - El Framework de React
- [Supabase](https://supabase.com/) - Alternativa open source a Firebase
- [ShadCN UI](https://ui.shadcn.com/) - Componentes diseñados bellamente
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utility-first
- [Radix UI](https://www.radix-ui.com/) - Primitivos de componentes accesibles

---

**Enlaces de Documentación**  
[Docs Next.js](https://nextjs.org/docs) | [Docs Supabase](https://supabase.com/docs) | [Docs Tailwind](https://tailwindcss.com/docs) | [ShadCN UI](https://ui.shadcn.com) | [TypeScript](https://www.typescriptlang.org/docs)

**Hecho con ❤️ por Flywheel Studio**

**[English](README.md) | Español**
