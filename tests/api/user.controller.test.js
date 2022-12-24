const should = require('should');
const request = require('supertest');
const testConfig = require('../config');

describe('/api/users', () => {

    let server = null;
    before((done) => {
        server = testConfig.server;
        done();
    });

    let user = null;

    describe('#getuserlist()', () => {
        it('should be getuserlist success', (done) => {
            request(server)
                .get('/api/users/list')
                .set('Accept', 'application/json')
                .expect(200)
                .then(response => {

                    should(response.body).be.ok();

                    let data = response.body;

                    console.log('getuserlists ', data)

                    done();
                }).catch(err => {
                    done(err);
                });


        });
    });


    describe('#post()', () => {
        it('should be addusers success', (done) => {
            request(server)
                .post('/api/users/add')
                .set('Accept', 'application/json')
                .send({ username: 'test' })
                .expect(200)
                .then(response => {

                    should(response.body).be.ok();
                    done();
                }).catch(err => {
                    done(err);
                });


        });
    });

    describe('#post()', () => {
        it('should be updateusers success', (done) => {
            request(server)
                .post('/api/users/update')
                .set('Accept', 'application/json')
                .send({ username: 'testasdsd' + new Date().getTime(), id: 12 })
                .expect(200)
                .then(response => {

                    should(response.body).be.ok();
                    done();
                }).catch(err => {
                    done(err);
                });


        });
    });

    after((done) => {
        testConfig.release().then(() => {
            done();
        }).catch(done);
    });
})
    ;
