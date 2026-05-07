import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1776339681025 implements MigrationInterface {
    name = 'InitialSchema1776339681025'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "email" character varying NOT NULL,
            "hashed_password" character varying NOT NULL,
            "full_name" character varying,
            "role" character varying NOT NULL DEFAULT 'viewer',
            "is_active" boolean NOT NULL DEFAULT true,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
            CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`CREATE INDEX "ix_users_email" ON "users" ("email") `);

        await queryRunner.query(`CREATE TABLE "locations" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "name" character varying NOT NULL,
            "code" character varying NOT NULL,
            "description" character varying,
            "floor" character varying,
            "zone" character varying,
            "capacity" integer NOT NULL DEFAULT 0,
            "current_items" integer NOT NULL DEFAULT 0,
            "coordinates" jsonb,
            "is_active" boolean NOT NULL DEFAULT true,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_1c65ef243169e51b514c814eeae" UNIQUE ("code"),
            CONSTRAINT "PK_locations_id" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`CREATE INDEX "ix_locations_name" ON "locations" ("name") `);
        await queryRunner.query(`CREATE INDEX "ix_locations_code" ON "locations" ("code") `);

        await queryRunner.query(`CREATE TABLE "devices" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "name" character varying NOT NULL,
            "serial_number" character varying NOT NULL,
            "location_id" uuid,
            "type" character varying,
            "status" character varying,
            "configuration" jsonb,
            "last_seen" TIMESTAMP,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_devices_id" PRIMARY KEY ("id"),
            CONSTRAINT "FK_devices_location_id" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        )`);
        await queryRunner.query(`CREATE INDEX "ix_devices_name" ON "devices" ("name") `);
        await queryRunner.query(`CREATE INDEX "ix_devices_serial_number" ON "devices" ("serial_number") `);

        await queryRunner.query(`CREATE TABLE "inventory" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "name" character varying NOT NULL,
            "description" character varying,
            "sku" character varying,
            "barcode" character varying,
            "location_id" uuid,
            "quantity" integer NOT NULL DEFAULT 0,
            "last_scanned_at" TIMESTAMP,
            "last_scanned_by" uuid,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_inventory_id" PRIMARY KEY ("id"),
            CONSTRAINT "FK_inventory_location_id" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT "FK_inventory_last_scanned_by" FOREIGN KEY ("last_scanned_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        )`);
        await queryRunner.query(`CREATE INDEX "ix_inventory_name" ON "inventory" ("name") `);
        await queryRunner.query(`CREATE INDEX "ix_inventory_barcode" ON "inventory" ("barcode") `);

        await queryRunner.query(`CREATE TABLE "tasks" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "title" character varying NOT NULL,
            "description" character varying,
            "completed" boolean NOT NULL DEFAULT false,
            "owner_id" uuid,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_tasks_id" PRIMARY KEY ("id"),
            CONSTRAINT "FK_tasks_owner_id" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        )`);

        await queryRunner.query(`CREATE TABLE "activity_logs" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "user_id" uuid,
            "inventory_item_id" uuid NOT NULL,
            "action" character varying NOT NULL,
            "action_type" character varying NOT NULL,
            "location" character varying,
            "has_barcode_scan" boolean NOT NULL DEFAULT false,
            "is_alert" boolean NOT NULL DEFAULT false,
            "details" jsonb,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_activity_logs_id" PRIMARY KEY ("id"),
            CONSTRAINT "FK_activity_logs_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT "FK_activity_logs_inventory_item_id" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        )`);

        await queryRunner.query(`CREATE TABLE "device_alerts" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "device_id" uuid,
            "message" character varying NOT NULL,
            "acknowledged" boolean NOT NULL DEFAULT false,
            "acknowledged_by" uuid,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_device_alerts_id" PRIMARY KEY ("id"),
            CONSTRAINT "FK_device_alerts_device_id" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT "FK_device_alerts_acknowledged_by" FOREIGN KEY ("acknowledged_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        )`);

        await queryRunner.query(`CREATE TABLE "camera_captures" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "device_id" uuid,
            "location_id" uuid,
            "image_url" character varying NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_camera_captures_id" PRIMARY KEY ("id"),
            CONSTRAINT "FK_camera_captures_device_id" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT "FK_camera_captures_location_id" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        )`);

        await queryRunner.query(`CREATE TABLE "scan_history" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "inventory_item_id" uuid,
            "device_id" uuid,
            "user_id" uuid,
            "scanned_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_scan_history_id" PRIMARY KEY ("id"),
            CONSTRAINT "FK_scan_history_inventory_item_id" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT "FK_scan_history_device_id" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT "FK_scan_history_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "scan_history"`);
        await queryRunner.query(`DROP TABLE "camera_captures"`);
        await queryRunner.query(`DROP TABLE "device_alerts"`);
        await queryRunner.query(`DROP TABLE "activity_logs"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(`DROP TABLE "inventory"`);
        await queryRunner.query(`DROP TABLE "devices"`);
        await queryRunner.query(`DROP TABLE "locations"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
