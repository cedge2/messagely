const express = require('express');
const router = new express.Router();
const Message = require('../models/message');
const { authenticateJWT, ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');
const ExpressError = require("../expressError");


/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get('/:id', ensureLoggedIn, async function(req, res, next) {
    try {
      const message = await Message.get(req.params.id);
  
      if (req.user.username !== message.from_user.username && req.user.username !== message.to_user.username) {
        throw new ExpressError("You are not authorized to view this message", 401);
      }
  
      return res.json({ message });
    } catch (err) {
      return next(err);
    }
  });
  

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', ensureLoggedIn, async function(req, res, next) {
    try {
      const { to_username, body } = req.body;
      const from_username = req.user.username; // username is fetched from the token in authenticateJWT middleware
  
      const message = await Message.create({from_username, to_username, body});
  
      return res.json({ message });
    } catch (err) {
      return next(err);
    }
  });

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:id/read', ensureLoggedIn, async function(req, res, next) {
    try {
      const id = req.params.id;
      const message = await Message.get(id);
  
      if (req.user.username !== message.to_user.username) {
        throw new ExpressError("You are not authorized to mark this message as read", 401);
      }
  
      const readMessage = await Message.markRead(id);
  
      return res.json({ message: readMessage });
    } catch (err) {
      return next(err);
    }
  });
  
  module.exports = router;
  