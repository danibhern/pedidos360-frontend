# Pedidos360 · Backend

API de catálogo y pedidos implementada con AWS Lambda, integrada con Amazon API Gateway y protegida mediante tokens JWT emitidos por Microsoft Entra ID.

El backend se encuentra en la carpeta `backend/` del repositorio de Pedidos360. Su configuración y sus dependencias se mantienen separadas de las del frontend.

## Arquitectura

```text
Frontend
   │
   │ HTTPS · Access token de Microsoft Entra ID
   ▼
API Gateway · HTTP API
   │
   │ Validación JWT y ámbitos por ruta
   ▼
AWS Lambda
   │
   │ Lógica de negocio y controles de autorización
   ▼
Amazon DynamoDB
```

### Componentes

| Componente | Responsabilidad |
|---|---|
| Microsoft Entra ID | Autenticación y emisión de tokens para acceder a la API |
| API Gateway | Exposición de rutas, validación JWT y comprobación de ámbitos |
| AWS Lambda | Procesamiento de solicitudes y lógica de negocio |
| DynamoDB | Persistencia del catálogo y los pedidos |
| Serverless Framework | Configuración de las funciones y extensiones de recursos |

## Configuración del servicio

| Propiedad | Valor |
|---|---|
| Servicio | `pedidos360-api` |
| Stage | `dev` |
| Región | `us-east-1` |
| Runtime de Lambda | `nodejs24.x` |
| Framework | Serverless Framework 4 |
| Memoria predeterminada | 128 MB |
| Timeout predeterminado | 3 segundos |
| Arquitectura predeterminada | `arm64` |

Las funciones de actualización y eliminación de productos utilizan `x86_64`, de acuerdo con la configuración de los recursos existentes.

## Estructura del proyecto

```text
backend/
├── config/
│   ├── environment.dev.json
│   └── resource-extensions.dev.json
├── src/
│   ├── catalog-create.mjs
│   ├── catalog-delete.mjs
│   ├── catalog-list.mjs
│   ├── catalog-update.mjs
│   ├── orders-create.mjs
│   ├── orders-list.mjs
│   └── orders-status-update.mjs
├── .gitignore
├── package.json
├── package-lock.json
├── serverless.yml
└── README.md
```

## API y autorización

Todas las rutas utilizan el authorizer JWT de API Gateway.

| Método | Endpoint | Operación | Ámbito requerido |
|---|---|---|---|
| `GET` | `/catalog` | Consultar catálogo | `catalog.read` |
| `POST` | `/catalog` | Crear producto | `catalog.write` |
| `PUT` | `/catalog/{id}` | Actualizar producto | `catalog.write` |
| `DELETE` | `/catalog/{id}` | Eliminar producto | `catalog.write` |
| `GET` | `/orders` | Consultar pedidos | `orders.read` |
| `POST` | `/orders` | Crear pedido | `orders.write` |
| `PUT` | `/orders/{id}/status` | Actualizar estado de un pedido | `orders.write` |

### Modelo de autorización

La configuración distingue dos niveles:

1. Acceso a la API: validación del JWT y del ámbito requerido por la ruta.
2. Autorización de negocio: controles implementados en las funciones, como comprobaciones de rol o restricciones de acceso a los datos.

Los ámbitos no deben reemplazar los controles de negocio del backend.

El frontend solicita los permisos de la API mediante MSAL. Las credenciales de AWS utilizadas para operar la infraestructura son independientes de los tokens de los usuarios.

## Funciones Lambda

| Identificador en Serverless | Handler | Nombre existente en AWS |
|---|---|---|
| `catalogList` | `src/catalog-list.handler` | `catalog-list` |
| `catalogCreate` | `src/catalog-create.handler` | `catalog-create` |
| `catalogUpdate` | `src/catalog-update.handler` | `catolog-udpate` |
| `catalogDelete` | `src/catalog-delete.handler` | `catalog-delete` |
| `ordersList` | `src/orders-list.handler` | `orders-list` |
| `ordersCreate` | `src/orders-create.handler` | `orders-create` |
| `ordersStatusUpdate` | `src/orders-status-update.handler` | `orders-status-update` |

## Alcance de infraestructura como código

La configuración actual de Serverless declara las funciones Lambda y las extensiones de sus recursos y grupos de logs.

| Recurso o configuración | Gestión actual |
|---|---|
| Funciones Lambda | Declaradas en `serverless.yml` |
| Extensiones de funciones y grupos de logs | Definidas en `config/resource-extensions.dev.json` |
| Variable `ORDERS_TABLE` de `ordersCreate` | Definida en `config/environment.dev.json` |
| API Gateway, rutas y authorizer | Recursos existentes; no declarados como eventos HTTP |
| Ámbitos por ruta | Configurados directamente en AWS mediante AWS CLI |
| Tablas DynamoDB | Recursos existentes referenciados |
| Rol `LabRole` | Rol existente referenciado |

### Recursos del entorno actual

| Recurso | Valor |
|---|---|
| Stack | `pedidos360-api-dev` |
| HTTP API | `y92zjw9o80` |
| Authorizer JWT | `xz8xx0` |
| Stage de API Gateway | `$default` |
| Tabla de catálogo | `Pedidos360Catalog` |
| Tabla de pedidos | `Pedidos360Orders` |
| Rol de ejecución | `LabRole` |

El stage `$default` tiene despliegue automático habilitado. Esta propiedad de API Gateway es independiente del despliegue de las funciones mediante Serverless.

## Configuración

### Variables del entorno

`config/environment.dev.json` contiene la configuración utilizada por `ordersCreate`:

```json
{
  "ordersCreate": {
    "ORDERS_TABLE": "Pedidos360Orders"
  }
}
```

### Extensiones de recursos

`config/resource-extensions.dev.json` conserva propiedades de los recursos existentes, entre ellas:

- Nombres de funciones y grupos de logs.
- Arquitecturas de ejecución.
- Configuración de logging.
- Políticas `DeletionPolicy: Retain` y `UpdateReplacePolicy: Retain`.

Ambos archivos son necesarios para resolver las referencias `${file(...)}` de la configuración actual.

## Instalación y validación

Los comandos del backend deben ejecutarse desde su carpeta, no desde la raíz del frontend.

### Instalar dependencias

```bash
cd backend
npm ci
```

### Comprobar sintaxis

```bash
(
  set -e

  for file in src/*.mjs; do
    node --check "$file"
    printf 'OK: %s\n' "$file"
  done
)
```

Esta comprobación no ejecuta las funciones ni sustituye las pruebas funcionales.

### Resolver la configuración de Serverless

```bash
npx serverless print
```

La salida debe incluir:

- Servicio `pedidos360-api`.
- Stage `dev`.
- Región `us-east-1`.
- Las siete funciones.
- `ORDERS_TABLE: Pedidos360Orders`.
- Las extensiones de recursos.

Este comando permite inspeccionar la configuración resuelta; no realiza un despliegue.

## Credenciales y seguridad

Las credenciales temporales del laboratorio se mantienen fuera del repositorio, mediante la configuración local de AWS.

Antes de operar la infraestructura, comprobar la identidad utilizada:

```bash
aws sts get-caller-identity \
  --profile default \
  --region us-east-1 \
  --no-cli-pager
```

No incorporar al repositorio:

- Claves de acceso de AWS.
- Secret access keys.
- Session tokens.
- Access tokens de usuarios.
- Contraseñas o cadenas de conexión con secretos.

## Despliegue

Antes de desplegar:

1. Confirmar que las credenciales del laboratorio están vigentes.
2. Verificar la cuenta de AWS de destino.
3. Revisar servicio, stage y región.
4. Resolver la configuración con `serverless print`.
5. Revisar los cambios y las referencias a recursos existentes.

Desde `backend/`:

```bash
npx serverless deploy \
  --stage dev \
  --region us-east-1 \
  --aws-profile default
```

> El despliegue modifica infraestructura en AWS. No debe ejecutarse como una prueba de sintaxis ni es necesario por el solo hecho de reorganizar las carpetas del repositorio.

### Consultar el estado del stack

```bash
aws cloudformation describe-stacks \
  --stack-name pedidos360-api-dev \
  --profile default \
  --region us-east-1 \
  --query 'Stacks[].{StackName:StackName,Status:StackStatus}' \
  --output json \
  --no-cli-pager
```

## Estado de verificación

| Comprobación | Estado |
|---|---|
| Instalación de dependencias | Completada |
| Sintaxis de las siete funciones | Verificada |
| Resolución de configuración desde `backend/` | Verificada |
| Ámbitos configurados en las siete rutas | Verificados |
| Lectura de pedidos con los ámbitos activos | Verificada |
| Lectura de catálogo con los ámbitos activos | Verificada |
| Operaciones de escritura | Pendientes de verificación |
| Controles de autorización con distintos usuarios y roles | Pendientes de verificación |
| Pruebas automatizadas | No implementadas |

El script `npm test` actual es un marcador de posición y no ejecuta una suite de pruebas.

## Control de versiones

Se excluyen del repositorio las dependencias instaladas, los artefactos de Serverless, los respaldos y los archivos de entorno locales:

```text
node_modules/
.serverless/
backups/
.env
.env.*
```


