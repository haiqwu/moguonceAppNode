const User = require('../models/user');
const { errorHandler } = require('../helpers/dbErrorHandler');
const jwt = require('jsonwebtoken'); // to generate signed token
const expressJwt = require('express-jwt'); // for authorization check


exports.signup = (req, res) => {
    // console.log('LOG: req.body : ', req.body);
    const user = new User(req.body);
    user.save((err, user) => {
        if (err) {
            return res.status(400).json({
                err: errorHandler(err)
            });
        }
        // no error
        user.salt = undefined
        user.hashed_password = undefined
        res.json({
            user
        })
    });
};

exports.signin = (req, res) => {
    // find the user based on email
    const { email, password } = req.body
    User.findOne({ email }, (err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'Email not registered. Please sign up first'
            });
        }
        // if user is found, make sure the email and password match
        // use authenticate method in user model
        if (!user.authenticate(password)) {
            return res.status(401).json({
                error: 'Invalid login and/or password.'
            })
        }

        // generate a signed token with user id and secret
        const token = jwt.sign({_id: user._id }, process.env.JWT_SECRET, {       }); // {expiresIn: '3h' }
        // persist the token as 't' in cookie with expire date
        // currently set as expire: 3 hours (10800 sec)
        res.cookie('t', token, { expire: new Date() + 10800 });
        // return response with user and token to frontend client
        const { _id, last_name, first_name, email, role } = user;
        return res.json({ token, user: { _id, email, last_name, first_name, role }});
    });
};

exports.signout = (req, res) => {
    res.clearCookie('t');
    res.json({ message: 'Signout success'});
};

/**
 * Jwt Token Checker Middleware:
 * 1. Grab the request header info (containing jwt token that clients sending in), and check for
 *  token validation.
 * 2. Check if token's secret(when it was generated in signin) matches with secret in .env file
 * 3. Check for expiry date of token
 * 4. if all good, then it decodes the token and generate the 'data' out
 *  (user._id was used to generate this token so 'data' is _id) and put it available as req.auth;
 *  then, it will hold _id of the logged-in user.
 */
exports.requireSignin = expressJwt({
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"], // added algorithm
    userProperty: 'auth', // put it available as req.auth
});

/**
 * 
 * [req.auth holds the _id of the logged-in user]
 * [router.param of 'userId' was used to put user in req as profile, so if user passed in 
 *  userId as param, then in req, we will have req.profile ready]
 */
exports.isAuth = (req, res, next) => {
    let user = req.profile && req.auth && req.profile._id == req.auth._id
    if (!user) {
        return res.status(403).json({
            error: 'Access denied'
        });
    }
    next();
};

exports.isAdmin = (req, res, next) => {
    if (req.profile.role === 0) {
        return res.status(403).json({
            error: 'Admin resource! Access denied.'
        });
    }
    next();
};










