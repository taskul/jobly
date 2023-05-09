"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Jobs = require('./job.js');
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe('create', function() {
    const newJob = {
        title: "software developer",
        salary: 100000,
        equity: '0.5',
        company_handle: "c1"
    }
    test("works", async function() {
        let job = await Jobs.create(newJob);
        expect(job).toEqual({
            id: expect.any(Number),
            title: "software developer",
            salary: 100000,
            equity: '0.5',
            company_handle: "c1"
        });
        // check the database to make sure we created a new job
        const result = await db.query(
            `SELECT title, salary, equity, company_handle
                FROM jobs
                WHERE id = ${job.id}`);
        expect(result.rows).toEqual([newJob]);
    });
});

/************************************** findAll */

describe('findAll', function () {
    test("works: no filter", async function() {
        let jobs = await Jobs.findAll();
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title:'prompt engineer',
                salary: 120000,
                equity: "0.55",
                company_handle: 'c1'
            },
            {
                id: expect.any(Number),
                title:'technical designer',
                salary: 110000,
                equity: '0.4',
                company_handle: 'c2'
            }
        ]);
    });
});

/************************************** get */
describe("get", function () {
    test("works", async function () {
        const newJob = {
            title: "software developer",
            salary: 100000,
            equity: '0.5',
            company_handle: "c1"
        }
        let job = await Jobs.create(newJob);
        let jobFound = await Jobs.get(job.id);
        expect(jobFound).toEqual({
            id: expect.any(Number),
            title: "software developer",
            salary: 100000,
            equity: '0.5',
            company_handle: "c1"
        });
    });
    test("not found if no such job", async function () {
      try {
        await Jobs.get(0);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
});

/************************************** update */

describe("update", function () {
    const updateData = {
        title: "software engineer",
        salary: 110000,
        equity: '0.6',
      };
    const newJob = {
        title: "software developer",
        salary: 100000,
        equity: '0.5',
        company_handle: "c1"
    };
    let job;
    test("works", async function() {
        job = await Jobs.create(newJob);
        let jobToUpdate = await Jobs.update(job.id, updateData);
        expect(jobToUpdate).toEqual({
            id: expect.any(Number),
            title: "software engineer",
            salary: 110000,
            equity: '0.6',
            company_handle: "c1"
        })
        // check the database to make sure we updated the job
        const result = await db.query(
            `SELECT title, salary, equity, company_handle
                FROM jobs
                WHERE id = ${job.id}`);
        expect(result.rows).toEqual([{
            title: "software engineer",
            salary: 110000,
            equity: '0.6',
            company_handle: "c1"
        }]);
    });

    test("not found if no such job", async function () {
        try {
          await Jobs.update(0, updateData);
          fail();
        } catch (err) {
          expect(err instanceof NotFoundError).toBeTruthy();
        }
      });
    
      test("bad request with no data", async function () {
        try {
          await Jobs.update(job.id, {});
          fail();
        } catch (err) {
          expect(err instanceof BadRequestError).toBeTruthy();
        }
      });
});

/************************************** remove */

describe("remove", function () {
    const newJob = {
        title: "software developer",
        salary: 100000,
        equity: '0.5',
        company_handle: "c1"
    };
    let job;
    test("works", async function () {
      job = await Jobs.create(newJob);
      await Jobs.remove(job.id);
      const res = await db.query(
          `SELECT title FROM jobs WHERE id=${job.id}`);
      expect(res.rows.length).toEqual(0);
    });
  
    test("not found if no such company", async function () {
      try {
        await Jobs.remove(0);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
  });
  