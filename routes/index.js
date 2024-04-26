// Import required modules
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const User = require('../models/user');
const Review = require('../models/review')

// Initialize Express app and Router
const app = express();
const router = express.Router();

// Add session middleware
router.use(session({
  secret: 'SaNNMHzlTBxP2hY5',
  resave: true,
  saveUninitialized: true
}));

// Define the Dish schema and model
const dishSchema = new mongoose.Schema({
    name: String,
    address: String,
    photo: String,
    location: String,
    description: String,
    price: Number,
    createdAt: {
        type: Date,
        default: Date.now
    }
});
const Dish = mongoose.model('Dish', dishSchema);

// Define routes
router.get('/', async (req, res, next) => {
    try {
        const dishes = await Dish.find();
        res.render('index', { dishes });
    } catch (err) {
        next(err);
    }
});

router.get('/registration', (req, res, next) => {
    res.render('registration.ejs');
});

// Route for retrieving data from the database
router.get('/addDish', async (req, res, next) => {
    try {
      const dishes = await Dish.find();
      res.render('addDish.ejs', { dishes });
    } catch (err) {
      next(err);
    }
});

router.get('/displayUsers', async (req, res, next) => {
    try {
      // Fetch all reviews from MongoDB
      const users = await User.find();
      console.log(users); // For debugging
      res.render('displayUsers.ejs', { users });
    } catch (err) {
      // Pass error to error handling middleware
      next(err);
    }
});

router.get('/displayFeedback', async (req, res, next) => {
    try {
      // Fetch all reviews from MongoDB
      const reviews = await Review.find();
    //   console.log(reviews); // For debugging
      res.render('displayFeedback.ejs', { reviews });
    } catch (err) {
      // Pass error to error handling middleware
      next(err);
    }
  });

router.get('/feedback', (req, res, next) => {
    return res.render('feedback.ejs');
});

router.get('/adminPanel', (req, res, next) => {
    return res.render('adminPanel.ejs');
});

router.get('/adminLogin', (req, res, next) => {
    return res.render('adminLogin.ejs');
});

router.get('/homepage', (req, res, next) => {
    return res.render('index2.ejs');
});

router.post('/', async (req, res, next) => {
    let personInfo = req.body;

    if (!personInfo.email || !personInfo.username || !personInfo.password || !personInfo.passwordConf) {
        res.sendStatus(400);
    } else {
        if (personInfo.password === personInfo.passwordConf) {
            try {
                const existingUser = await User.findOne({ email: personInfo.email });
                if (!existingUser) {
                    const lastUser = await User.findOne({}).sort({_id: -1}).limit(1);
                    const c = lastUser ? lastUser.unique_id + 1 : 1;
                    let newPerson = new User({
                        unique_id: c,
                        email: personInfo.email,
                        username: personInfo.username,
                        password: personInfo.password,
                        passwordConf: personInfo.passwordConf
                    });

                    await newPerson.save();
                    req.session.userId = c; // Set session userId
                    res.send({ "Success": "You are registered, you can login now." });
                } else {
                    res.send({ "Success": "Email is already used." });
                }
            } catch (err) {
                next(err);
            }
        } else {
            res.send({ "Success": "Password does not match." });
        }
    }
});

router.get('/login', (req, res, next) => {
    return res.render('login.ejs');
});

router.post('/login', (req, res, next) => {
    User.findOne({ email: req.body.email }, (err, data) => {
        if (data) {
            if (data.password == req.body.password) {
                req.session.userId = data.unique_id; // Set session userId
                res.send({ "Success": "Success!" });
            } else {
                res.send({ "Success": "Wrong password!" });
            }
        } else {
            res.send({ "Success": "This Email Is not registered!" });
        }
    });
});

router.get('/profile', (req, res, next) => {
    User.findOne({ unique_id: req.session.userId }, (err, data) => {
        if (!data) {
            res.redirect('/');
        } else {
            return res.render('data.ejs', { "name": data.username, "email": data.email });
        }
    });
});

router.get('/logout', (req, res, next) => {
    if (req.session) {
        // Destroy session
        req.session.destroy((err) => {
            if (err) {
                return next(err);
            } else {
                return res.redirect('/');
            }
        });
    }
});

router.get('/forgetpass', (req, res, next) => {
    res.render("forget.ejs");
});

router.post('/forgetpass', (req, res, next) => {
    User.findOne({ email: req.body.email }, (err, data) => {
        if (!data) {
            res.send({ "Success": "This Email Is not registered!" });
        } else {
            if (req.body.password == req.body.passwordConf) {
                data.password = req.body.password;
                data.passwordConf = req.body.passwordConf;

                data.save((err, Person) => {
                    if (err)
                        console.log(err);
                    else
                        console.log('Success');
                    res.send({ "Success": "Password changed!" });
                });
            } else {
                res.send({ "Success": "Password does not match! Both Passwords should be the same." });
            }
        }
    });

});

router.post('/insert', async (req, res, next) => {
    try {
      const { name, address, photo, location, description, price } = req.body;
      const dish = new Dish({ name, address, photo, location, description, price });
      await dish.save();
      res.redirect('/addDish');
    } catch (err) {
      next(err);
    }
});

router.get('/search', async (req, res, next) => {
  try {
      const searchTerm = req.query.term; // Get search term from query parameter
      let dishes;
      if (searchTerm) {
          // If search term exists, perform search based on name field
          dishes = await Dish.find({ name: { $regex: searchTerm, $options: 'i' } }); // Case-insensitive search using regex
      } else {
          // If no search term, fetch all dishes
          dishes = await Dish.find();
      }
      res.render('search', { dishes, searchTerm });
  } catch (err) {
      next(err);
  }
});

router.post('/feed', (req, res, next) => {
    let feedbackInfo = req.body;

    if (!feedbackInfo.feedback) {
        res.status(400).json({ message: "Feedback cannot be empty" });
    } else {
        let newFeedback = new Review({
            email: feedbackInfo.email,
            username: feedbackInfo.username,
            feedback: feedbackInfo.feedback
        });

        newFeedback.save((err, savedFeedback) => {
            if (err) {
                console.error(err);
                res.status(500).json({ message: "An error occurred while saving feedback" });
            } else {
                res.status(200).json({ message: "Thank you for your feedback" });
                
            }
        });
    }
});

router.post('/adLogin', (req, res) => {
    const { email, password } = req.body;
    // Example validation
    if (email === 'pranjalsingh.ak@gmail.com' && password === 'pranjal') {
        res.json({ Success: "Success!" });
    } else {
        res.json({ Success: "Invalid email or password" });
    }
});





// Export the router
module.exports = router;
