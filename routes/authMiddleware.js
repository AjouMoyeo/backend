const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyToken= async function (req,res,next){

    try{

        req.decoded = jwt.verify(req.headers.accessToken, process.env.JWT_SECRET);
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
