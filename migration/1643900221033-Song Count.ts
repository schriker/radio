import {MigrationInterface, QueryRunner} from "typeorm";

export class SongCount1643900221033 implements MigrationInterface {
    name = 'SongCount1643900221033'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "song" ADD "count" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "song" DROP COLUMN "count"`);
    }

}
