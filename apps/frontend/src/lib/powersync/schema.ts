import { Schema, TableV2, column } from '@powersync/web';

export const AppSchema = new Schema({
  items: new TableV2({
    code: column.text,
    name: column.text,
    location: column.text,
    stock: column.real,
    unit: column.text,
    type: column.text,
    image_url: column.text,
  }),
  kit_details: new TableV2({
    kit_id: column.text,
    item_id: column.text,
    quantity: column.real,
  }),
  movement_details: new TableV2({
    movement_id: column.text,
    item_id: column.text,
    quantity: column.real,
  }),
  movements: new TableV2({
    type: column.text,
    created_by_id: column.text,
    destination: column.text,
    observations: column.text,
    responsible_delivery_id: column.text,
    responsible_receipt_id: column.text,
    date: column.text,
    project_id: column.text,
  }),
  projects: new TableV2({
    name: column.text,
    contact: column.text,
    address: column.text,
    manager_id: column.text,
  }),
  staff: new TableV2({
    work_area_id: column.text,
  }),
  users: new TableV2({
    email: column.text,
    role: column.text,
    name: column.text,
    avatar: column.text,
    has_auth: column.integer,
  }),
  work_areas: new TableV2({
    name: column.text,
  }),
});

export type AppSchemaTables = typeof AppSchema.types;
