import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource, DataSourceOptions, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Verification } from 'src/users/entities/verification.entity';

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
  let usersRepository: Repository<User>;
  let verificationRepository: Repository<Verification>;
  let jwtToken: string;

  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest().set('X-JWT', jwtToken).send({ query });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    verificationRepository = module.get<Repository<Verification>>(
      getRepositoryToken(Verification),
    );
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
      return publicTest(`
        mutation {
          createAccount(input: {
            email:"${testUser.EMAIL}",
            password:"${testUser.PASSWORD}",
            role:Owner
          }) {
            success
            error
          }
        }`)
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
      return publicTest(`
        mutation {
          createAccount(input: {
            email:"${testUser.EMAIL}",
            password:"${testUser.PASSWORD}",
            role:Owner
          }) {
            success
            error
          }
        }`)
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
      return publicTest(`
        mutation {
          login(input:{
            email:"${testUser.EMAIL}",
            password:"${testUser.PASSWORD}",
          }) {
            success
            error
            token
          }
        }`)
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
      return publicTest(`
       mutation {
          login(input:{
            email:"${testUser.EMAIL}",
            password:"wrongPassword",
          }) {
           success
           error
           token
          }
        }`)
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

  describe('userProfile', () => {
    let userId: number;
    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });

    it("should see a user's profile", () => {
      return privateTest(`
        {
          userProfile(userId:${userId}){
            success
            error
            user {
              id
            }
          }
        }`)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                userProfile: {
                  success,
                  error,
                  user: { id },
                },
              },
            },
          } = res;
          expect(success).toBe(true);
          expect(error).toBe(null);
          expect(id).toBe(userId);
        });
    });

    it('should not find a profile', () => {
      return privateTest(`
        {
          userProfile(userId:10000){
            success
            error
            user {
              id
            }
          }
        }`)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                userProfile: { success, error, user },
              },
            },
          } = res;
          expect(success).toBe(false);
          expect(error).toBe('User Not Found');
          expect(user).toBe(null);
        });
    });
  });

  describe('me', () => {
    it('should find my profile', () => {
      return privateTest(`
        {
          me {
            email
          }
        }`)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;
          expect(email).toBe(testUser.EMAIL);
        });
    });

    it('should not allow logged out user', () => {
      return publicTest(`
        {
          me {
            email
          }
        }`)
        .expect(200)
        .expect((res) => {
          const {
            body: { errors },
          } = res;
          const [error] = errors;
          expect(error.message).toBe('Forbidden resource');
        });
    });
  });

  describe('editProfile', () => {
    const NEW_EMAIL = 'new@email.com';
    it('should change email', () => {
      return privateTest(`
        mutation {
          editProfile(input:{
            email: "${NEW_EMAIL}",
          }) {
            success
            error
          }
        }`)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                editProfile: { success, error },
              },
            },
          } = res;
          expect(success).toBe(true);
          expect(error).toBe(null);
        });
    });

    it('should have new email', () => {
      return privateTest(`
        {
          me {
            email
          }
        }`)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;
          expect(email).toBe(NEW_EMAIL);
        });
    });

    it('should fail to change email if email exist', () => {
      return privateTest(`
        mutation {
          editProfile(input:{
            email: "${NEW_EMAIL}",
          }) {
            success
            error
          }
        }`)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                editProfile: { success, error },
              },
            },
          } = res;
          expect(success).toBe(false);
          expect(error).toBe('Email Already Taken');
        });
    });
  });

  describe('verifyEmail', () => {
    let verificationCode: string;
    beforeAll(async () => {
      const [verification] = await verificationRepository.find();
      verificationCode = verification.code;
    });

    it('should fail on wrong verification code', () => {
      return publicTest(`
        mutation {
          verifyEmail(input:{
            code:"xxxx"
          }) {
            success
            error
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                verifyEmail: { success, error },
              },
            },
          } = res;
          expect(success).toBe(false);
          expect(error).toBe('Verification not found.');
        });
    });

    it('should verify email', () => {
      return publicTest(`
        mutation {
          verifyEmail(input:{
            code:"${verificationCode}"
          }) {
            success
            error
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                verifyEmail: { success, error },
              },
            },
          } = res;
          expect(success).toBe(true);
          expect(error).toBe(null);
        });
    });
  });
});
