import {MigrationInterface, QueryRunner} from "typeorm";

export class Song1643874755839 implements MigrationInterface {
    name = 'Song1643874755839'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "song" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "author" character varying NOT NULL, "title" character varying NOT NULL, "lengthSeconds" integer NOT NULL, "videoId" character varying NOT NULL, "channelId" character varying NOT NULL, "viewCount" character varying NOT NULL, "user" character varying NOT NULL, "userColor" character varying NOT NULL, "startTime" TIMESTAMP WITH TIME ZONE NOT NULL, "endTime" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_baaa977f861cce6ff954ccee285" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "song"`);
    }

}
