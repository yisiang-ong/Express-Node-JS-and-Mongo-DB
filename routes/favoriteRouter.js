const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorite');

const favoriteRouter = express.Router();

//use bodyParser to set up res.body
favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
//set up the options field
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req,res,next) => {
    //find: no matter the number of docs matched, a cursor (database) is returned, never null, returns all docs
    //findOne: if query matches, returns the first doc, only one
    Favorites.findOne({ user: req.user._id })
        .populate('user')
        .populate('dishes')
        .exec((err, favorites) => {
            if (err) return next(err);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorites);
        }); 
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id }, (err, favorite) => {
        if (err) return next(err);
        if (!favorite) {
            Favorites.create({ user : req.user._id})
            .then((favorite) => {
                for (i = 0; i < req.body.length; i++)
                    if (favorite.dishes.indexOf(req.body[i]._id) == -1)
                        favorite.dishes.push(req.body[i]);
                favorite.save()
                .then((favorite) => {
                    console.log('Favorite created');
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                })
                .catch((err) => {
                    return next(err);
                });
            })
            .catch((err) => {
                return next(err);
            });
        }
        else {
            for (i = 0; i < req.body.length; i++)
                if (favorite.dishes.indexOf(req.body[i]._id) == -1)
                    favorite.dishes.push(req.body[i]);
            favorite.save()
            .then((favorite) => {
                console.log('Favourite Dish Added');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            })
            .catch((err) => {
                return next(err);
            });
        }
    });
})  

.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain')
    res.end('PUT operation not supported on /favorites');
})

.delete(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOneAndRemove({ user: req.user._id}, (err, resp) => {
        if (err) return next(err);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.json(resp);
    });
});


favoriteRouter.route('/:dishId')
//set up the options field
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req,res,next) => {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain')
    res.end('GET operation not supported on /favorites/' + req.params.dishId);
})

.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id }, (err, favorite) => {
        if (err) return next(err);
        if (!favorite) {
            Favorites.create({ user : req.user._id})
            .then((favorite) => {
                favorite.dishes.push({"_id": req.params.dishId})
                favorite.save()
                .then((favorite) => {
                    console.log('Favorite created');
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                })
                .catch((err) => {
                    return next(err);
                });
            })
            .catch((err) => {
                return next(err);
            });
        }
        else {
            if (favorite.dishes.indexOf(req.params.dishId) == -1) {
                favorite.dishes.push({"_id":req.params.dishId});
                favorite.save()
                .then((favorite) => {
                    console.log('Favourite Dish Added');
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                })
                .catch((err) => {
                    return next(err);
                });
            }
            else {
                res.statusCode =403;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Dish '+ req.params.dishId + ' already exist in favorite.')
            }
        }
    });
})  

.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain')
    res.end('PUT operation not supported on /favorites/'+ req.params.dishId);
})

.delete(cors.corsWithOptions, authenticate.verifyUser,(req,res,next) => {
    Favorites.findOne({ user: req.user._id }, (err, favorite) =>{
        if (err) return next(err);
        var index = favorite.dishes.indexOf(req.params.dishId);
        if ( index >= 0) {
            //delete using .splice(index,deleteCount)
            favorite.dishes.splice(index,1);
            favorite.save()
            .then((favorite) => {
                console.log('Favourite Dish Deleted!', favorite);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            })
            .catch((err) => {
                return next(err);
            })
        }
        else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end('Dish '+req.params._id+' not in your favorite dish list.');
        }
    });
})

module.exports = favoriteRouter;