var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var FacebookTokenStrategy = require('passport-facebook-token');

var config = require('./config.js');


//use passport-local-mongoos module to authenticate as its more comprehensive
passport.use(new LocalStrategy(User.authenticate()));

//since use sessions to track users, need to serialize and deserialize the user
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//create JSON web token
exports.getToken = function(user) {
    return jwt.sign(user, config.secretKey,
        {expiresIn: 3600});
};

//configure json webtoken based strategy for passport app
var opts = {}; //options for jwt
//options specifies how the jwt  should be extracted from the incoming requeest
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken(); //included in the authentication header as a bearer token
opts.secretOrKey = config.secretKey; //supply the secret key for the strategy

//create new JWT passport startegy
exports.jwtPassport = passport.use(new JwtStrategy(opts,
    // done is the callback function which passes back information to passport which will
    // then used for loading things onto the request message
    (jwt_payload, done) => {
        console.log("JWT payload: ", jwt_payload);
        User.findOne({_id: jwt_payload._id}, (err, user) => {
            if (err) {
                return done(err, false);
            }
            else if (user) {
                return done(null, user);
            }
            else {
                return done(null, false);
            }
        });
    }));

//use the jwt strategy to authenticate
exports.verifyUser = passport.authenticate('jwt', {session: false});

//create verifyAdmin function
exports.verifyAdmin = function(req,res,next) {
    if (!req.user.admin) {
        var err = new Error('You are not an admin!');
        res.setHeader('WWW-Authenticate', 'Basic');      
        err.status = 403;
        return next(err);
    }
    else{
        return next();
    }
}

exports.facebookPassport = passport.use(new FacebookTokenStrategy({
    clientID: config.facebook.clientId,
    clientSecret: config.facebook.clientSecret
}, (accessToken, refreshToken, profile, done) => {
    User.findOne({facebookId: profile.id}, (err, user) => {
        if (err) {
            return done(err, false);
        }
        if (!err && user !== null) {
            return done(null, user);
        }
        else {
            user = new User({ username: profile.displayName });
            user.facebookId = profile.id;
            user.firstname = profile.name.givenName;
            user.lastname = profile.name.familyName;
            user.save((err, user) => {
                if (err)
                    return done(err, false);
                else
                    return done(null, user);
            })
        }
    });
}
));