# Pedidos360 API

Repositorio del backend de Pedidos360.

El frontend se mantiene en un repositorio independiente.
Este repositorio contiene el código local de las funciones
que ya fueron creadas y probadas en AWS Lambda.

## Estructura

- src/catalog-create.mjs
- src/catalog-delete.mjs
- src/catalog-list.mjs
- src/catalog-update.mjs
- src/orders-create.mjs
- src/orders-list.mjs

## Dependencias

- @aws-sdk/client-dynamodb
- @aws-sdk/lib-dynamodb
- @aws-sdk/util-dynamodb

## Tablas utilizadas

- Pedidos360Catalog
- Pedidos360Orders

## Verificaciones realizadas

- Revisión de sintaxis de los seis archivos con node --check.
- Instalación de las dependencias del backend.
- Creación del repositorio Git local.
- Subida inicial a GitHub.

## Estado del despliegue

Las funciones ya existen en AWS Lambda y fueron probadas allí.

No se ha configurado un despliegue automático desde este
repositorio hacia AWS Lambda. Los cambios guardados en GitHub
no deben considerarse desplegados automáticamente.