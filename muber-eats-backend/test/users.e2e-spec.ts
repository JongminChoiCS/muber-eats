import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource, DataSourceOptions } from 'typeorm';

const testUser = {
  EMAIL: 'joey@test.com',
  PASSWORD: 'test.password',
};

jest.mock('got', () => {
  return {
    post: jest.fn(),
  };
});

const GRAPHQL_ENDPOINT = '/graphql';

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    const option: DataSourceOptions = {
      type: 'mysql',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };

    const dataSource = new DataSource(option);

    await dataSource.initialize();
    await dataSource.query(`SET FOREIGN_KEY_CHECKS = 0`);
    Promise.all([
      dataSource.query(`TRUNCATE user`),
      dataSource.query(`TRUNCATE verification`),
    ]);
    await dataSource.query(`SET FOREIGN_KEY_CHECKS = 1`);
    await dataSource.destroy();
    app.close();
  });

  describe('createAccount', () => {
    it('should create account', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation {
            createAccount(input: {
              email:"${testUser.EMAIL}",
              password:"${testUser.PASSWORD}",
              role:Owner
            }) {
              success
              error
            }
          }
          `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { createAccount },
            },
          } = res;
          expect(createAccount.success).toBe(true);
          expect(createAccount.error).toBe(null);
        });
    });

    it('should fail if account already exists', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation {
            createAccount(input: {
              email:"${testUser.EMAIL}",
              password:"${testUser.PASSWORD}",
              role:Owner
            }) {
              success
              error
            }
          }
        `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { createAccount },
            },
          } = res;
          expect(createAccount.success).toBe(false);
          expect(createAccount.error).toBe(
            'There is a user with that email already',
          );
        });
    });
  });

  describe('login', () => {
    it('should login with correct credentials', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
        mutation {
          login(input:{
            email:"${testUser.EMAIL}",
            password:"${testUser.PASSWORD}",
          }) {
            success
            error
            token
          }
        }`,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.success).toBe(true);
          expect(login.error).toBe(null);
          expect(login.token).toEqual(expect.any(String));
          jwtToken = login.token;
        });
    });

    it('should not be able to login with wrong credentials', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
      mutation {
        login(input:{
          email:"${testUser.EMAIL}",
          password:"wrongPassword",
        }) {
          success
          error
          token
        }
      }`,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.success).toBe(false);
          expect(login.error).toBe('Wrong password');
          expect(login.token).toBe(null);
        });
    });
  });

  it.todo('userProfile');
  it.todo('me');
  it.todo('verifyEmail');
  it.todo('editProfile');
});
