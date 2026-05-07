import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLocationRelationships1776339681027 implements MigrationInterface {
    name = 'AddLocationRelationships1776339681027'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add location_id to activity_logs
        await queryRunner.query(`ALTER TABLE "activity_logs" ADD COLUMN "location_id" uuid`);
        await queryRunner.query(`ALTER TABLE "activity_logs" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_activity_logs_location_id" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL`);

        // Add location_id to devices
        await queryRunner.query(`ALTER TABLE "devices" ADD COLUMN "location_id" uuid`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "devices" ADD CONSTRAINT "FK_devices_location_id" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL`);

        // Add location_id to scan_history
        await queryRunner.query(`ALTER TABLE "scan_history" ADD COLUMN "location_id" uuid`);
        await queryRunner.query(`ALTER TABLE "scan_history" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "scan_history" ADD CONSTRAINT "FK_scan_history_location_id" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert activity_logs
        await queryRunner.query(`ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_activity_logs_location_id"`);
        await queryRunner.query(`ALTER TABLE "activity_logs" DROP COLUMN "location_id"`);
        await queryRunner.query(`ALTER TABLE "activity_logs" ADD COLUMN "location" character varying`);

        // Revert devices
        await queryRunner.query(`ALTER TABLE "devices" DROP CONSTRAINT "FK_devices_location_id"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "location_id"`);
        await queryRunner.query(`ALTER TABLE "devices" ADD COLUMN "location" character varying`);

        // Revert scan_history
        await queryRunner.query(`ALTER TABLE "scan_history" DROP CONSTRAINT "FK_scan_history_location_id"`);
        await queryRunner.query(`ALTER TABLE "scan_history" DROP COLUMN "location_id"`);
        await queryRunner.query(`ALTER TABLE "scan_history" ADD COLUMN "location" character varying`);
    }
}
