const express = require('express');
const router = express.Router();
//adding the auth middleware as a second parameter will make this route protected
const auth = require('../../middleware/auth');
const config = require('config');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');

//@route GET api/auth
//@desc Test route
//@access Public
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id) //user.id is appended to request on middleware auth ln16
      .select('-password'); //remove pw from data

    /*This line puts the user inside the response so that when
      you make a GET request to this route, you receive user data back*/

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error. Please try again later.');
  }
});

//@route POST api/auth
//@desc  Authenticate User and get token
//@access Public
router.post(
  '/',
  [
    check('email', 'Please include a valid email.').isEmail(),
    check('password', 'Password is required. ').exists()
  ],
  async (req, res) => {
    console.log(req.body); //this is the object of data that is gonna be sent to this route
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email }); //Bring the user by email from DB

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password); //match typed pw with brought pw
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      //Define the body of the post request
      const payload = {
        user: {
          id: user.id
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
