const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('./app');

jest.mock('mongodb');

describe('POST /profile', () => {
  it('should create a new profile in the database and return a successful response', async () => {
    const insertOne = jest.fn(() => ({ insertedId: 'abc123' }));
    const collection = { insertOne };
    const database = { collection: jest.fn(() => collection) };
    const client = { db: jest.fn(() => database), connect: jest.fn(), close: jest.fn() };
    MongoClient.mockImplementation(() => client);

    const res = await request(app)
      .post('/profile')
      .field('name', 'John Doe')
      .field('email', 'john.doe@example.com')
      .attach('picture', './test/fixtures/profile.jpg')
      .attach('resume', './test/fixtures/resume.pdf');

    expect(res.status).toEqual(200);
    expect(res.text).toContain('Profile for John Doe created with ID abc123');
    expect(client.connect).toHaveBeenCalled();
    expect(client.db).toHaveBeenCalledWith('example');
    expect(database.collection).toHaveBeenCalledWith('profiles');
    expect(collection.insertOne).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john.doe@example.com',
      profilePicture: expect.any(String),
      resume: expect.any(String),
    });
    expect(client.close).toHaveBeenCalled();
  });

  it('should return an error response when there is an error connecting to the database', async () => {
    const error = new Error('Unable to connect to database');
    const client = { connect: jest.fn(() => Promise.reject(error)), close: jest.fn() };
    MongoClient.mockImplementation(() => client);

    const res = await request(app)
      .post('/profile')
      .field('name', 'John Doe')
      .field('email', 'john.doe@example.com')
      .attach('picture', './test/fixtures/profile.jpg')
      .attach('resume', './test/fixtures/resume.pdf');

    expect(res.status).toEqual(500);
    expect(res.text).toEqual('An error occurred');
    expect(client.connect).toHaveBeenCalled();
    expect(client.close).toHaveBeenCalled();
  });
});
