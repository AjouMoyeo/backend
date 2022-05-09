const nodemailer = require('nodemailer');
require("dotenv").config();
const smtpTransport = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    
    auth: {
      user: process.env.NM_EMAIL,
      pass: process.env.NM_PW
    }
});

  module.exports={
      smtpTransport
  }