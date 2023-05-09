"use strict";

/** Routes for jobs. */

const jsonschema = require('jsonschema')
const express = require('express')

const { BadRequestError } = require("../expressError");
const { ensureIsAdmin } = require("../middleware/auth");
const Jobs = require('../models/job');

const jobNewSchema = require('../schemas/jobNew.json');
const jobUpdateSchema = require('../schemas/jobUpdate.json');
const jobFilterSchema = require('../schemas/jobFilter.json');
const router = new express.Router();

/** POST / { job } => { job }
 * 
 *  job should be { title, salary, equity, company_handle }
 * 
 *  Returns { id, title, salary, equity, company_handle }
 * 
 *  Authorization required: Admin
*/

router.post('/', ensureIsAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema)
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const job = await Jobs.create(req.body);
        return res.status(201).json({ job })
    } catch (err) {
        return next(err);
    };
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, company_handle }, ...] }
 *
 * Can filter on provided search filters:
 *  title
 *  minSalary
 *  hasEquity
 * 
 * Authorization required: none
 */

router.get('/', async function (req, res, next) {
    try {
        let jobs;
        if(Object.keys(req.query).length > 0) {
            const q = req.query;
            if (q.minSalary) q.minSalary = +q.minSalary;
            if (q.hasEquity) {
                q.hasEquity = q.hasEquity === 'true' ? true : false;
            }
            const validator = jsonschema.validate(q, jobFilterSchema);
            if (!validator.valid) {
              const errs = validator.errors.map(e => e.stack);
              throw new BadRequestError(errs);
            }
            jobs = await Jobs.filterAll(req.query);
          } else {
          // otherwise just show all companies
            jobs = await Jobs.findAll();
          }
        return res.json({jobs});
    } catch (err) {
        return next(err);
    };
});

/** GET /[jobId]  =>  { job }
 *
 *  Job is { id, title, salary, equity, company_handle }
 *
 * Authorization required: none
 */

router.get('/:id', async function (req, res, next) {
    try {
        const job = await Jobs.get(req.params.id);
        return res.json({job})
    } catch (err) {
        return next(err);
    };
});

/** PATCH /[jobId] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, company_handle }
 *
 * Authorization required: admin
 */

router.patch('/:id', ensureIsAdmin, async function (req, res, next) {
    try {

        const validator = jsonschema.validate(req.body, jobUpdateSchema)
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const job = await Jobs.update(req.params.id, req.body);
        return res.json({job})
    } catch (err) {
        return next(err)
    }
})

/** DELETE /[jobId]  =>  { deleted: id }
 *
 * Authorization: admin
 */

router.delete('/:id', ensureIsAdmin, async function (req, res, next) {
    try {
        await Jobs.remove(req.params.id);
        return res.json({deleted: req.params.id});
    } catch (err) {
        return next(err);
    };
});

module.exports = router;