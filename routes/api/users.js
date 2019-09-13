/*
All endpoints are made accessible on server.js
*/
const express = require('express');
//Since routes are being defined in separate files, bring in the Express.js Router.
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
//Use validator for user requests
const { check, validationResult } = require('express-validator'); //Express-validator.github
const User = require('../../models/User'); //Bring the model

//@route GET api/users -> this is the actual request type
//@desc Register User -> description of what this route does
//@access Public -> description of authentication level requirement
router.post(
  '/',
  [
    //Express JS Validator check() function -> check field, add message and define RULE
    check('name', 'Name is required')
      .not()
      .isEmpty(),
    check('email', 'Please include a valid email.').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters. '
    ).isLength({ min: 6 })
  ],
  async (req, res) => {
    console.log(req.body); //this is the object of data that is gonna be sent to this route
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    try {
      let user = await User.findOne({ email }); //to check if user with unique email exists
      if (user) {
        res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }
      const avatar = gravatar.url(email, {
        s: '200', //Size
        r: 'pg', //rating (PG, 18+, 22+ etc)
        d: 'mm' //Default pic
      });
      //if user does not exist, create it
      user = new User({
        name,
        email,
        avatar,
        password
      });
      const salt = await bcrypt.genSalt(10); //variable created for hashing and encoding password
      user.password = await bcrypt.hash(password, salt); //creates a HASH w user.password and the salt.

      //and after pw is secured, save the user.
      await user.save();

      //Define the body of the post request
      const payload = {
        user: {
          id: user.id //Mongo uses an _id to id an object - mongoose allows to use Object.id
        }
      };

      jwt.sign(
        payload,
        config.get('jwtToken'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;

/*
User registraton logic:
  - Check if user exists
  - Get users gravatar (based on the email)
  - ENCRYPT password -> use BCrypt
  - Return jsonwebtoken
*/
