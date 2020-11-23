const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
// Load User model
const User = require('../models/User');
const { forwardAuthenticated } = require('../config/auth');
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'iotformtest@gmail.com',
    pass: 'PASSWORD'
  }
});

const welcomeMail = {
  from: 'iotformtest@gmail.com',
  to: 'newmail',
  subject: 'Welcome to E-toll service',
  text: 'Thank you for registration to our E-toll service.Your starting balance has been Rs.0.'
}

const paymentSuccess = {
  from: 'iotformtest@gmail.com',
  to: 'newmail',
  subject: 'Your toll payment has been successfully receivied',
  text: 'Your current balance is now'
}

const paymentFailure = {
  from: 'iotformtest@gmail.com',
  to: 'newmail',
  subject: 'Your toll payment was unsuccessfull',
  text: 'Your current balance is now'
}

// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('login'));

// Register Page
router.get('/register', forwardAuthenticated, (req, res) => res.render('register'));

// Register
router.post('/register', (req, res) => {
  const { name, email, vno, tagid, ctype, password, password2 } = req.body;
  
  const balance =0
  let errors = [];

  if (!name || !email || !password || !password2 || !vno || !tagid || ! ctype) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (password != password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      name,
      email,
      vno,
      tagid,
      password,
      password2
    });
  } else {
    User.findOne({ email: email }).then(user => {
      if (user) {
        errors.push({ msg: 'Email already exists' });
        res.render('register', {
          errors,
          name,
          email,
          password,
          password2
        });
      } else {
        const newUser = new User({
          name,
          email,
          vno,
          tagid,
          ctype,
          balance,
          password
        });

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => {
                req.flash(
                  'success_msg',
                  'You are now registered and can log in'
                );                
                let newUserMail = {...welcomeMail};                
                newUserMail.to = newUser.email;
                transporter.sendMail(newUserMail, function(error, info){
                  if (error) {
                    console.log(error);
                  } else {
                    console.log('Email sent: ' + info.response);
                  }
                });
                res.redirect('/users/login');
              })
              .catch(err => console.log(err));
          });
        });
      }
    });
  }
});

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

//Balance Incement
router.post('/inc', (req,res)=>{
  var myquery = { email: req.user.email };
  var newb = req.user.balance +100; 
  var newvalues = { $set: {balance: newb  } };
  User.updateOne(myquery, newvalues, function(err, res) {
      if (err) throw err;
      console.log("1 document updated");
    
      // db.close();
    });
  req.flash(
                    'success_msg',
                    'Your balance updated'
                  );

  res.redirect('/dashboard');

});

//GET ALL RECORDS
router.route('/records').get(function(req,res){
  User.find((err,records)=>{
      if(err){
          console.log(err);
      }
      else{
          res.json(records);
      }
  });    
});


//Check records and verify balance
router.route('/records/:id').get(function(req,res){
  User.findOne({tagid : req.params.id}, (err,record)=>{
      if(err){
          console.log(err);
      }
      else{
          if(!record){
            res.json("record not found");
          }else{
          //Check for balance and send appropriate response
            if(record.balance< record.ctype){
              let newUserMail = {...paymentFailure};                
                newUserMail.to = record.email;
                newUserMail.text = `Your toll payment for vehicle number + ${record.vno} + has been unsuccessfull due to insufficient balance`;
                transporter.sendMail(newUserMail, function(error, info){
                  if (error) {
                    console.log(error);
                  } else {
                    console.log('Email sent: ' + info.response);
                  }
                });
              res.json({
                success: false,
                message: `Your toll payment for vehicle number ${record.vno} has failed due to insufficient balance`
              })
            }else{
              record.balance = record.balance-record.ctype;
              record.save().then(record=>{
                let newUserMail = {...paymentSuccess};                
                newUserMail.to = record.email;
                newUserMail.text = `Your toll payment for vehicle number ${record.vno} has been successfull.Your current balance is now ${record.balance}`;
                transporter.sendMail(newUserMail, function(error, info){
                  if (error) {
                    console.log(error);
                  } else {
                    console.log('Email sent: ' + info.response);
                  }
                });
                res.json({
                  success: true,
                  message: `Your toll payment for vehicle number ${record.vno} is successfull.Your current balance is ${record.balance}`
                });
              }).catch(err=>{
                console.log(err);
              })
            }

            ///res.json({
          ///    'tagid':record.tagid,
          ///    'ctye':record.ctype,
          ///    'balance': record.balance
          ///  });
          }
      }
  });    
});

// Logout
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/users/login');
});

module.exports = router;
