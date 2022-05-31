const nodemailer = require('nodemailer');
require("dotenv").config();
const smtpTransport = nodemailer.createTransport({
    service: 'Naver',
    host: 'smtp.naver.com',
    
    auth: {
      user: process.env.NM_EMAIL,
      pass: process.env.NM_PW
    }
});




  module.exports={
      smtpTransport
  }