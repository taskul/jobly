"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureIsAdmin, ensureIsAdminOrCurrentUser } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");
const generator = require('generate-password')
const router = express.Router();


/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: admin
 **/

router.post("/", async function (req, res, next) {
  try {
    // setting a random password for the user
    // then the jwt token can be sent to the user and they will use it
    // to access user profile where they can change the password to 
    // what they want. 
    const password = generator.generate({
      length: 10,
      numbers: true
    })
    req.body.password = password
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register({ ...req.body, isAdmin: false });
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});

/** POST / [username] { jobs } [ id ]  => { jobs }
 *
 * Given username and jobId new relationship created in applications table
 * connecting user to jobs they apply for
 *
 * This returns the newly created relationship in applications table :
 *  {username, job_id}
 *
 * Authorization required: admin or current user matching username
 **/

router.post('/:username/jobs/:id', ensureIsAdminOrCurrentUser, async function (req, res, next) {
  try {
    const job = await User.applyForJob(req.params.username, req.params.id)
    return res.status(201).json({ applied: req.params.id })
  } catch (err) {
    return next(err)
  }
})

/** GET / [username] { jobs }  => { jobs }
 *
 * This returns list of jobs user applied for:
 *  {jobs: { username, firstName, lastName, id, title, salary, equity, name, description }, ... }
 *
 * Authorization required: admin or current user matching username
 **/

router.get('/:username/jobs', ensureIsAdminOrCurrentUser, async function (req, res, next) {
  try {
    const jobs = await User.getUserJobs(req.params.username);
    return res.json({jobs});
  } catch (err) {
    return next(err);
  }
})

/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: admin
 **/

router.get("/", ensureIsAdmin, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin }
 *
 * Authorization required: logged in current user that matches username or admin
 **/

router.get("/:username", ensureIsAdminOrCurrentUser, async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: logged in current user that matches username or admin
 **/

router.patch("/:username", ensureIsAdminOrCurrentUser, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: logged in current user that matches username or admin
 **/

router.delete("/:username", ensureIsAdminOrCurrentUser, async function (req, res, next) {
  try {
    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
