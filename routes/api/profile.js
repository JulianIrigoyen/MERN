const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const request = require('request');
const config = require('config');

const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

//@route GET api/profile/me
//@desc Get current user profile
//@access Private - Auth required
router.get('/me', auth, async (req, res) => {
  //we need async/await because mongoose returns promises
  try {
    const profile = await Profile.findOne({ user: req.user.id }) //Will pertain to profile model user field! ;)
      .populate('user', ['name', 'avatar']);
    //Check if profile exists if it does put in res otherwise throw 400
    if (!profile) {
      res.status(400).json({ msg: 'There is no profile for this user' });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route POST api/profile
//@desc Create or update a user profile
//@access Private - Auth required
router.post(
  '/',
  [
    //We need to pass both the auth middleware and the validator (just check for status & skills)
    auth,
    [
      check('status', 'Status is required')
        .not()
        .isEmpty(),
      check('skills', 'Skills are required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin
    } = req.body;

    //Build profile objects
    const profileFields = {};

    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(',').map(skill => skill.trim());
    }
    console.log(profileFields.skills);

    //Build social
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        //Update profile
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }
      //Create profile if it does not exist
      profile = new Profile(profileFields);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route GET api/profile
//@desc Get all profiles
//@access Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route GET api/profile/user/:user_id
//@desc Get profile by id
//@access Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }) //user_id is coming from URL so check the Request (req) for it
      .populate('user', ['name', 'avatar']);

    //Check for profile existence
    if (!profile) return res.status(400).json({ msg: 'Profile not found' });

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' });
    }
  }
});

//@route DELETE api/profile
//@desc Delete profile, user & posts
//@access Private
router.delete('/', auth, async (req, res) => {
  try {
    //Remove user profile
    await Profile.findOneAndRemove({
      user: req.user.id
    }); //being this route private, there is access to auth middleware, so there is access to the token
    //Remove user
    await User.findOneAndRemove({ _id: req.user.id });
    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route PUT api/profile/experience
//@desc Add profile experience
//@access Private
router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required')
        .not()
        .isEmpty(),
      check('company', 'Company is required')
        .not()
        .isEmpty(),
      check('from', 'From date is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json({ errors: error.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body; //Extract fields from request.

    const newExp = {
      //same as doing req.body.title = newExp.title etc
      title,
      company,
      location,
      from,
      to,
      current,
      description
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp); //unshift() == push() but pushes in the beginning of []

      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route DELETE api/profile/experience/:exp_id
//@desc Add profile experience
//@access Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    //get the remove index from experience array
    const removeIndex = profile.experience
      .map(item => item.id)
      .indexOf(req.params.exp_id); // map the object id in the route url to exp item in DB

    profile.experience.splice(removeIndex, 1);
    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message).send('Server Error');
  }
});

//@route PUT api/profile/education
//@desc Add profile education
//@access Private
router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is required')
        .not()
        .isEmpty(),
      check('degree', 'Degree is required')
        .not()
        .isEmpty(),
      check('fieldofstudy', 'Field of Study is required')
        .not()
        .isEmpty(),
      check('from', 'From date is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json({ errors: error.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      location,
      from,
      to,
      current,
      description
    } = req.body;

    const newEducation = {
      school,
      degree,
      fieldofstudy,
      location,
      from,
      to,
      current,
      description
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEducation);

      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route DELETE api/profile/experience/:exp_id
//@desc Add profile experience
//@access Private
router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    const removeIndex = profile.education
      .map(item => item.id)
      .indexOf(req.params.edu_id);

    profile.education.splice(removeIndex, 1);
    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message).send('Server Error');
  }
});

//@route GET api/profile/github/:username
//@desc Get user repos from github
//@access Public
// const githubClientId = config.get('githubClientId');
// const githubSecret = config.get('githubSecret');
// console.log(githubClientId, githubSecret);
// router.get('/github/:username', async (req, res) => {
//   try {
//     const options = {
//       uri:
//         'https://api.github.com/users/${req.params.username}/repos?per_age=5&sort=created:asc&client_id=' +
//         githubClientId +
//         '&client_secret=' +
//         githubSecret,
//       method: 'GET',
//       headers: { 'user-agent': 'node.js' }
//     };

//     request(options, (error, response, body) => {
//       if (error) console.error(error);

//       if (response.statusCode != 200) {
//         res.status(404).json({ msg: 'No GitHub profile found' });
//       }

//       res.json(JSON.parse(body));
//     });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server Error');
//   }
// });

module.exports = router;
