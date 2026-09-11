const request = require('supertest');
const app = require('../src/app.js');

test('Sanity check', () => {
  expect(true).toBe(true);
});

test('Health Check', async () => {
  await request(app).get('/health').expect(200);
})