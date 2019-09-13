const jwt = require('jsonwebtoken');
const config = require('config');
const jwtToken = config.get('jwtToken');

module.exports = function(req, res, next) {
  //Get the token from header
  const requestToken = req.header('x-auth-token'); //header key where we wanna send the token in

  //Check for case where there is no token at all.
  if (!requestToken) {
    return res.status(401).json({ msg: 'No token - Acces denied.' });
  }
  //Verify the token
  try {
    const decoded = jwt.verify(requestToken, jwtToken); //this will decode the token
    req.user = decoded.user; //appends user request body
    next();
  } catch (err) {
    //will run if token is not valid
    res.status(401).json({ msg: 'Invalid token. Try using another one.' });
  }
};
