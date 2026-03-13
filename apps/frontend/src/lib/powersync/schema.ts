import { Schema, TableV2, column } from '@journeyapps/powersync-sdk-web';

export const AppSchema = new Schema({
  Item: new TableV2({
    code: column.text,
    name: column.text,
    location: column.text,
    stock: column.real,
    unit: column.text,
    type: column.text,
    imageUrl: column.text,
  }),
  Movement: new TableV2({
    type: column.text,
    createdById: column.text,
    destination: column.text,
    observations: column.text,
    responsibleDeliveryId: column.text,
    responsibleReceiptId: column.text,
    date: column.text,
    projectId: column.text,
  }),
  MovementDetail: new TableV2({
    movementId: column.text,
    itemId: column.text,
    quantity: column.real,
  }),
  Project: new TableV2({
    name: column.text,
    contact: column.text,
    address: column.text,
    managerId: column.text,
  }),
});

export type AppSchemaTables = typeof AppSchema.types;
