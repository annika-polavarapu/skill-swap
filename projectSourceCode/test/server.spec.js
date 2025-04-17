// // ********************** Initialize server **********************************

// const server = require('../src/index'); //TODO: Make sure the path to your index.js is correctly added

// // ********************** Import Libraries ***********************************

// const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
// const chaiHttp = require('chai-http');
// chai.should();
// chai.use(chaiHttp);
// const {assert, expect} = chai;

// // ********************** DEFAULT WELCOME TESTCASE ****************************

// describe('Server!', () => {
//   // Sample test case given to test / endpoint.
//   it('Returns the default welcome message', done => {
//     chai
//       .request(server)
//       .get('/welcome')
//       .end((err, res) => {
//         expect(res).to.have.status(200);
//         expect(res.body.status).to.equals('success');
//         assert.strictEqual(res.body.message, 'Welcome!');
//         done();
//       });
//   });
// });

// // *********************** TODO: WRITE 2 UNIT TESTCASES **************************
// describe('Testing Register API', () => {

//   // Positive test case: Register a new user
//   it('positive : /register - should register a new user', (done) => {
//     chai
//       .request(server)
//       .post('/register')
//       .send({
//         username: 'Tester',
//         password: 'Testing123'
//       })
//       .end((err, res) => {
//         expect(res).to.have.status(200);
//         done();
//       });
//   });

//   // Negative test case: Try to register with the same username
//   it('negative : /register - should reject duplicate username', (done) => {
//     const duplicateUser = {
//       username: 'Tester', // Same username as positive test
//       password: 'Testig1231' // Diff password
//     };

//     chai
//       .request(server)
//       .post('/register')
//       .send(duplicateUser)
//       .end((err, res) => {
//         // Verify the response
//         expect(res).to.have.status(409); // 409 Conflict is standard for duplicates
//         done();
//       });
//   });

// });

// // *********************** TESTING LOGIN API WITH SETUP AND TEARDOWN **************************

// describe('Login Route Tests', () => {
//   // Positive Test Case
//   it('should return 200 and success message for valid credentials', done => {
//     const validUser = {
//       username: 'Tester',
//       password: 'Testing123',
//     };

//     chai
//       .request(server)
//       .post('/login')
//       .send(validUser)
//       .end((err, res) => {
//         expect(res).to.have.status(200);
//         console.log('res.body:', res.body);
//         done();
//       });
//   });
  
//   // Negative Test Case
//   it('should return 401 and failure message for invalid credentials', done => {
//     const invalidUser = {
//       username: 'invaliduser',
//       password: 'wrongpass',
//     };
  
//     chai
//       .request(server)
//       .post('/login')
//       .send(invalidUser)
//       .end((err, res) => {
//         expect(res).to.have.status(401);
//         expect(res.body.message).to.equal('Incorrect username/email or password.');
//         done();
//       });
//   });
  
// });
// // ********************************************************************************