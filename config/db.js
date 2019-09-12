/*
Mongo DB Connection Script example using dependencies implemented in this project. 
*/
//Get dependencies -> Mongoose to connect
const mongoose = require('mongoose');

//bring config package gran Mongo credentials from default.json
//after bringing the package, bring the actual credentials
const config = require('config');
const db = config.get('mongoURI');

const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      //mongoose.connect returns a promise, so we use await
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false
    });

    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
