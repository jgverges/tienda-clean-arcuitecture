
## 1. Autenticación

### Ubicación en la arquitectura Clean

La autenticación se distribuye a través de varias capas de la arquitectura Clean:

1. **Dominio**: Contiene las entidades (User), value objects (Password), e interfaces (AuthenticationService, UserRepository) relacionadas con la autenticación.
2. **Aplicación**: Contiene los casos de uso relacionados con la autenticación (AuthenticateUserUseCase).
3. **Infraestructura**: Contiene las implementaciones concretas de los repositorios y servicios de autenticación.
4. **Presentación**: Contiene los componentes de UI y hooks relacionados con la autenticación.

## 2. Gestión de estado

### Implementación de Zustand y TanStack Query

### Ubicación en la arquitectura Clean

La gestión de estado se sitúa principalmente en la capa de presentación de la arquitectura Clean:

1. **Zustand**: Se utiliza para manejar el estado global de la aplicación, especialmente para datos que necesitan ser compartidos entre múltiples componentes.
2. **TanStack Query**: Se utiliza para manejar el estado de las peticiones a la API y la caché de datos.
