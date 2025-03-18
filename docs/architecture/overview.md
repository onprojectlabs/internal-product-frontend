# Arquitectura General

Este documento describe la arquitectura de alto nivel de la aplicación, sus principales componentes y cómo interactúan entre sí.

## Visión General

La aplicación está construida siguiendo una arquitectura basada en componentes React con un enfoque modular centrado en características (feature-based). Utiliza TypeScript para un tipado estricto y Tailwind CSS para el estilado.

## Patrones de Diseño

### Arquitectura Basada en Características

En lugar de organizar el código por tipo de archivo (MVC tradicional), la aplicación está estructurada principalmente alrededor de las características (features) del negocio. Cada característica principal tiene su propio directorio que contiene todos los componentes, hooks, servicios y tipos relacionados con esa característica.

### Patrones de Estado

- **Context API**: Para estado global ligero y compartido entre componentes relacionados
- **Custom Hooks**: Encapsulan lógica reutilizable y acceso a APIs externas
- **Estado local**: Utilizando `useState` y `useReducer` para estado específico de componentes

### Patrones de Componentes

- **Componentes Controlados vs No Controlados**: Se utilizan componentes controlados para formularios donde se necesita validación en tiempo real
- **Composición**: Preferencia por la composición sobre la herencia
- **Componentes de Presentación/Contenedor**: Separación entre lógica de negocio y presentación

## Flujo de Datos

```
APIs Externas <--> Servicios <--> Hooks/Contextos <--> Componentes <--> UI
```

1. Los **servicios** manejan la comunicación con las APIs externas y abstraen los detalles de implementación
2. Los **hooks y contextos** consumen estos servicios y proporcionan los datos a los componentes
3. Los **componentes** renderizan la UI basada en estos datos y manejan la interacción del usuario
4. Las **acciones del usuario** se propagan de vuelta a través de callbacks, eventualmente llegando a los servicios para actualizar datos en el servidor

## Comunicación en Tiempo Real

Para funcionalidades que requieren actualizaciones en tiempo real, la aplicación utiliza:

- **WebSockets**: Para actualizaciones del estado de procesamiento de documentos
- **Polling**: En algunos casos específicos donde WebSockets no es óptimo

## Estructura de Directorios

```
src/
  ├── components/     # Componentes UI reutilizables
  │   ├── common/     # Componentes base (botones, inputs, etc.)
  │   ├── layout/     # Componentes estructurales (headers, sidebars, etc.)
  │   └── [feature]/  # Componentes específicos de una característica
  │
  ├── context/        # Contextos React para estado global
  │
  ├── hooks/          # Custom hooks
  │   ├── document-processing/  # Hooks para procesamiento de documentos
  │   ├── storage/    # Hooks para almacenamiento local
  │   └── theme/      # Hooks para manejo de temas
  │
  ├── pages/          # Componentes de páginas principales
  │   └── [feature]/  # Páginas específicas de una característica
  │
  ├── services/       # Servicios para comunicación con APIs
  │   └── [feature]/  # Servicios específicos de una característica
  │
  ├── types/          # Definiciones de tipos TypeScript
  │
  └── utils/          # Funciones utilitarias
```

## Estrategia de Carga

La aplicación utiliza:

- **Carga perezosa (Lazy Loading)**: Para componentes pesados y rutas de la aplicación
- **Estrategias de Suspense**: Para mostrar estados de carga mientras los componentes se cargan

## Gestión de Estado

- **Estado Local**: Para datos específicos de un componente
- **Context API**: Para estado compartido entre componentes relacionados
- **Estado del Servidor**: Los datos del servidor se mantienen en caché localmente usando hooks personalizados

## Seguridad

- **Autenticación**: Basada en tokens JWT almacenados en localStorage
- **Autorización**: Control de acceso basado en roles implementado a nivel de componente y ruta
- **Validación de Datos**: Validación tanto en el cliente como en el servidor

## Estrategia de Pruebas

La aplicación puede probarse a diferentes niveles:

- **Pruebas Unitarias**: Para funciones utilitarias y lógica de negocio
- **Pruebas de Componentes**: Para garantizar que los componentes se rendericen correctamente
- **Pruebas de Integración**: Para verificar la interacción entre componentes y servicios
- **Pruebas E2E**: Para flujos de usuario completos

## Referencias

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
