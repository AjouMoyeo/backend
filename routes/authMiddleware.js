const jwt = require("jsonwebtoken");
const db = require("../database");
db.connect();
require("dotenv").config();

const verifyToken= async function (req,res,next){

    try{
      console.log(req.headers.authorization);
      req.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
      console.log("!!!!"+req.decoded);
      return next();
        

    }catch(e){
        if (e.name === 'TokenExpiredError') {
          console.log("토큰 만료");
          
          return res.status(419).json({
            code: 419,
            message: '토큰이 만료되었습니다.'
          });
        }
        console.log("Invalid token");
        return res.status(401).json({
          code: 401,
          message: '유효하지 않은 토큰입니다.'
        });

    }



}

module.exports=verifyToken;
