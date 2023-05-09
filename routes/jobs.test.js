"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
  testJobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function () {
  const newJob = {
    title:'prompt engineer',
    salary: 120000,
    equity: 0.55,
    company_handle: 'c1'
  };

  test("ok for admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title:'prompt engineer',
        salary: 120000,
        equity: "0.55",
        company_handle: 'c1'
      }
    });
  });

  test('user is not an admin', async function () {
    const resp = await request(app)
        .post('/jobs')
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401)
  })

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
            title: "Scrum master",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
            title:"Game developer",
            salary: "50k",
            equity:"0"
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /companies */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs :
          [
            {
                id: expect.any(Number),
                title:'Graphic design teacher',
                salary: 80000,
                equity: null,
                company_handle: 'c3'
            },
            {
                id: expect.any(Number),
                title: "software developer",
                salary: 100000,
                equity: '0.5',
                company_handle: "c1"
            },
            {
                id: expect.any(Number),
                title:'technical designer',
                salary: 110000,
                equity: null,
                company_handle: 'c2'
            }
          ]
    });
  });
});

/************************************** GET /jobs/?queryStrings*/

describe('GET /jobs/', function() {
  // testing all 3 query strings together
  test('filter jobs using query strings using title, minSalary, hasEquity', async function () {
    const resp = await request(app)
        .get('/jobs/?title=re&minSalary=100000&hasEquity=true')
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({jobs: [
        {   
            id: expect.any(Number),
            title: "software developer",
            salary: 100000,
            equity: '0.5',
            company_handle: "c1"
          }
      ]})
  })
  test('filter jobs using query strings using minSalary', async function () {
    const resp = await request(app)
        .get('/jobs/?minSalary=100000')
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({jobs: [
            {
                id: expect.any(Number),
                title: "software developer",
                salary: 100000,
                equity: '0.5',
                company_handle: "c1"
            },
            {
                id: expect.any(Number),
                title:'technical designer',
                salary: 110000,
                equity: null,
                company_handle: 'c2'
            }
          ]})
  })
  test('filter jobs using query strings using hasEquity', async function () {
    const resp = await request(app)
        .get('/jobs/?hasEquity=true')
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({jobs: [
          {
            id: expect.any(Number),
            title: "software developer",
            salary: 100000,
            equity: '0.5',
            company_handle: "c1"
          }
          ]})
  })
})

/************************************** GET /companies/:handle */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${testJobIds[0]}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "software developer",
        salary: 100000,
        equity: '0.5',
        company_handle: "c1"
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/5556`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          title:"Senior software engineer",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job : {
        id: expect.any(Number),
        title: "Senior software engineer",
        salary: 100000,
        equity: '0.5',
        company_handle: "c1"
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
            title:"Senior software engineer",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test('user is not an admin', async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
            title:"Senior software engineer",
        })
        .set("authorization", `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(401);
  })

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/5566`)
        .send({
            title:"Senior software engineer",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
            title:"Senior software engineer",
            salary: "110K"
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /companies/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: `${testJobIds[0]}` });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test('user is not an admin', async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  })

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/5566`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
