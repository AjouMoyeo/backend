const nodemailer = require('nodemailer');

const smtpTransport = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    
    auth: {
      user: 'ajouselves@gmail.com',
      pass: 'dkwntpfqmwm'
    }
});

  module.exports={
      smtpTransport
  }