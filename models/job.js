"use strict"

const db = require('../db')
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Jobs {
    /** Create a job (from data), update db, return new job data.
     * 
     *  data should be { title, salary, equity, company_handle }
     * 
     *  Returns { id, title, salary, equity, company_handle }
     */

    static async create(data){
        const result = await db.query(
            `INSERT INTO jobs
             (title, salary, equity, company_handle) 
             VALUES ($1, $2, $3, $4)
             RETURNING id, title, salary, equity, company_handle`,
             [
                data.title,
                data.salary,
                data.equity,
                data.company_handle
             ]
        );
        return result.rows[0];
    };

    /** Find all jobs
     * 
     *  Returns [{ id, title, salary, equity, company_handle }, ...]
     */

    static async findAll() {
        const results = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle
            FROM jobs
            ORDER BY title`
        );
        return results.rows;
    };

    /** Filters jobs based on ?????????
     * 
     * 
     */
    static async filterAll(data) {
        let dbString = 'WHERE'
        let counter = 1;
        let dbValues = [];
        const {title, minSalary, hasEquity} = data;
        if (title) {
            dbString += ` title ILIKE $${counter}`
            dbValues.push(`%${title}%`)
            counter++
        }
        if (minSalary) {
            if (counter > 1) dbString += ' AND';
            dbString += ` salary >= $${counter} `;
            dbValues.push(minSalary)
            counter++
        }
        if (hasEquity) {
            if (counter > 1) dbString += ' AND';
            dbString += ` equity > 0`;
            counter++
        } 
        dbString += " ORDER BY title"
        const results = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle
            FROM jobs ${dbString}`,
            dbValues);
        
        return results.rows;
    };

    /** Given a job id, return data about the job
     * 
     *  Returns { id, title, salary, equity, company_handle }
     * 
     *  Throws NotFoundError if not found
     */

    static async get(jobId) {
        const result = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle
            FROM jobs
            WHERE id = $1`,
            [jobId]
        )
        const job = result.rows[0];
        if (!job) throw new NotFoundError(`No job found with id: ${jobId}`)

        return job;
    }

    /** Update job with data
     * 
     *  This is a "partial update" --- it's fine if data does't contain all the
     *  fields; this only changes provided ones.
     * 
     *  Data can include: { title, salary, equity }
     * 
     *  Returns { title, salary, equity, company_handle }
     * 
     *  Throws NotFoundError if not found.
     */

    static async update(jobId, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data, { 
                title:"title",
                salary: "salary",
                equity: "equity" 
            }
        )
        const handleVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs
                          SET ${setCols}
                          WHERE id = ${handleVarIdx}
                          RETURNING id,
                                    title,
                                    salary,
                                    equity,
                                    company_handle`;
        const result = await db.query(querySql, [...values, jobId]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job with id of ${jobId}`);

        return job;
    }

    /** Delete given job from database; returns undefined
     * 
     *  Throws NotFoundError if job not found
     */

    static async remove(jobId) {
        const result = await db.query(
            `DELETE 
            FROM jobs
            WHERE id = $1
            RETURNING id`,
            [jobId]
        )
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job with id of ${jobId}`)
    }
}   

module.exports = Jobs;