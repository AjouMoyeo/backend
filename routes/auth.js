const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const DB = require("../database"); // DB 정보 가져오기
const { smtpTransport } = require("../email");
const { nextTick } = require("process");

router.use(express.urlencoded({ extended: true }));
router.use(express.json());

const generateRandom = function (min, max) {
    var ranNum = Math.floor(Math.random() * (max - min + 1)) + min;
    return ranNum;
};

function createHashedPassword(plainPassword) {
    const salt = crypto.randomBytes(64).toString("base64");
    return [
      crypto
        .pbkdf2Sync(plainPassword, salt, 9999, 64, "sha512")
        .toString("base64"),
      salt,
    ];
}


const emailVerification = async function (req, res) {
    const email = req.body.email;
    const number = generateRandom(111111, 999999);
    const mailoptions = {
      from: "AjouMoyeo@naver.com",
      to: email,
      subject: "[아주모여] 인증 관련 메일입니다.",
      text: "오른쪽 숫자 6자리를 입력해주세요 : " + number,
    };
  
    try {
  
      
     
      //이메일 verification 코드
      const result = await smtpTransport.sendMail(
        mailoptions,
        (error, response) => {
          if (error) {
            console.log(error);
            return res.status(400).send({ status: "fail",text:"이메일 오류" });
          } else {
            /* 클라이언트에게 인증 번호를 보내서 사용자가 맞게 입력하는지 확인! */
            return res.status(200).send({
              status:"success",
              number: number,
            });
          }
          smtpTransport.close();
        }
      );
    
      
    } catch (e) {
      console.log(e);
      res.status(400).json({ text: "ErrorCode:400, 잘못된 요청입니다." });
    }
  };  

const register = async function (req,res){
    // const student_id= req.body.student_id;
    // const name = req.body.name;
    // const nickname = (req.body.nickname) ? req.body.nickname : null;
    // const email = (req.body.email) ? req.body.email : null;
    // const birth = (req.body.birth) ? req.body.birth : null;
    // const phone_num =req.body.phone_num;
    // const department = req.body.department;
    const encryption = createHashedPassword(req.body.password);
    const salt = encryption[1];
    const password =encryption[0];
    const refresh_token=null;
    const uservalue = [
        req.body.student_id,
        req.body.name,
        req.body.nickname,
      
        req.body.phone_num,
        req.body.department,
        salt,
        password,
        refresh_token
    ]
    try{
    await DB.promise().query(`INSERT INTO student(student_id,name,nickname,phone_num,department,salt,password,refresh_token) VALUES(?,?,?,?,?,?,?,?);`, uservalue);
    console.log("성공");
    res.json({status:"success",text:"회원가입 성공"});
    }catch(e){

        console.log(e);
        res.status(400).json({ status:"fail",text: "ErrorCode:400, 잘못된 요청입니다." });

    }

    //const 
    
    

}
const verifyIDPW = async function(req,res,next){
  const student_id = req.body.student_id;
  const password = req.body.password;
  


  try{
    const [data] = await DB.promise().query(`
    SELECT salt, password from student where student_id=${student_id}`);
    console.log(data[0].password);
    //데이터가 없다면 등록된 아이디가 아닙니다. 출력로직 작성필요
    const req_pw=[crypto.pbkdf2Sync(password,data[0].salt,9999,64,"sha512").toString("base64"),]
    //비밀번호 일치
    if(req_pw==data[0].password){ 

      console.log("비밀번호 일치");
      next();
    //비밀번호 불일치
    }else{ 
      console.log("비밀번호가 일치하지 않습니다.")
      res.json({status:"fail",text:"비밀번호가 일치하지 않습니다."});



    }

  }catch(e){

    console.log(e);
    res.status(400).json({ status:"fail",text: "ErrorCode:400, 잘못된 요청입니다." });


  }
}

const checkID= async function(req,res){
  try{
    const checkingid= req.params.id;
    const [data] = await DB.promise().query(`
    SELECT student_id from student where student_id=${checkingid}`);
    console.log(data);
    console.log(data[0]);
    if(data[0]==undefined){
      res.json({status:"success",text:"가입하지 않은 회원입니다."});
    }
    else{
      res.json({status:"fail", text:"이미 가입한 회원입니다."});
    }
  }catch(e){
    
    res.status(400).json({ status:"fail",text: "ErrorCode:400, 잘못된 요청입니다." });

  }

}


const login = async function(req,res){
  const student_id = req.body.student_id;
  const password = req.body.password;
  try{

    const token= jwt.sign({_id:student_id},process.env.JWT_SECRET,{expiresIn:"1h",issuer:"AjouMoyeo"})
    res.json({
      status:"success",
      text:"토큰이 발급되었습니다.",
      token:token

    })

  }catch(e){
    console.log("로그인 에러");
    res.status(400).json({ status:"fail",text: "ErrorCode:400, 잘못된 요청입니다." });


  }
}


/**
 * @swagger
 *
 * /auth/register:
 *  post:
 *    summary: "회원가입"
 *    description: "POST 방식으로 유저를 등록한다."
 *    tags: [Auth]
 *    requestBody:
 *      description: 사용자가 서버로 전달하는 값에 따라 결과 값은 다릅니다. (유저 등록)
 *      required: true
 *      content:
 *        application/x-www-form-urlencoded:
 *          schema:
 *            type: object
 *            properties:
 *              id:
 *                type: integer
 *                description: "유저 고유아이디"
 *              name:
 *                type: string
 *                description: "유저 이름"
 */


// localhost:3000/auth

router.post("/register",register);
router.post("/login",verifyIDPW,login);
router.get("/checkID/:id",checkID);
router.post("/email",emailVerification);
module.exports= router;
