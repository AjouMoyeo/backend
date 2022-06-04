const nodemailer = require('nodemailer');
require("dotenv").config();
const smtpTransport = nodemailer.createTransport({
    service: 'naver',
    host: 'smtp.naver.com',
    port: 465,
    auth: {
      user: process.env.NM_EMAIL,
      pass: process.env.NM_PW
    }
});




  module.exports={
      smtpTransport
  }