import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcryptjs';

export class SeedAdminUser1776339681028 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Hash password: admin123
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

    // Check if admin user already exists
    const existingAdmin = await queryRunner.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@trackify.com']
    );

    if (existingAdmin.length === 0) {
      await queryRunner.query(
        `INSERT INTO users (id, email, hashed_password, full_name, role, is_active, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [adminId, 'admin@trackify.com', hashedPassword, 'Admin User', 'admin', true]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DELETE FROM users WHERE email = $1',
      ['admin@trackify.com']
    );
  }
}
