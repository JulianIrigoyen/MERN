/*
These endpoints are made accessible on server.js
*/
const express = require('express');
//Since routes are being defined in separate files, we need to bring in the Express.js Router.
const router = express.Router();

//@route GET api/users -> this is the actual request type
//@desc Test route -> description of what this route does
//@access Public -> description of authentication level requirement
router.get('/', (req, res) => res.send('User route'));

//remember to export.
module.exports = router;
