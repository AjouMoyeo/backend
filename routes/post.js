const express = require('express');
const router =express.Router();
const jwt = require('jsonwebtoken');
const db= require('../database.js');
db.connect();
const multer= require('multer');
const verifyToken = require('./authMiddleware');

const storage = multer.diskStorage({
    destination: function(req, file, callback){
        callback(null, 'photo/')
    },
    filename: function(req, file, callback){
        callback(null, Date.now()+'-'+file.originalname)
    }
});

const upload= multer({
	storage:storage,
	limits:{
		files:10,
		fileSize: 1024*1024*5
	}
});

const getpost = async function (req,res){

    /*
    디테일한 post 정보 가져오는 코드 (댓글 포함)
    */
    const id = req.params.id;
    try{
        const [post]= await db.promise().query(`SELECT * FROM post AS p JOIN student AS s ON p.student_id=s.student_id WHERE p.post_id=${id};`);
        const [photos]= await db.promise().query(`SELECT * FROM photo WHERE post_id=${id} ORDER BY is_thumbnail desc;`);
        console.log(photos);
        post[0].photos= new Array();
        photos.forEach((photo)=>{
            post[0].photos.push(photo.url);

        })
        console.log(post[0].title);
    
        console.log(post);
        res.send({status:"success",post});
    }catch(e){
        console.log('getpost에서 error 발생!');
        res.status(400).json({ status: "fail",e });
    }

}

const getALLpost =async function(req,res){
    //모든 post 가져오는ㄱ코드
    try{
        const [data] = await db.promise().query(`SELECT p.post_id, p.student_id,p.title, p.text,p.category,p.goal_num,p.cur_num, p.is_anony, p.is_number, p.created_at,s.name, s.nickname, ph.url,ph.is_thumbnail FROM post as p INNER JOIN student as s ON p.student_id=s.student_id LEFT JOIN photo as ph ON ph.post_id=p.post_id ORDER BY p.created_at DESC`);
        //console.log(data);
        res.json({status:"success",data});


    }catch(e){
        console.log(e);
        console.log('getALLpost에서 error 발생!');
        res.status(400).json({ status: "fail" ,e});
    }


}

const addpost_nophoto= async function(req,res){
    const student_id = req.decoded._id;
    const title= req.body.title;
    const text= req.body.text;
    const category=req.body.category;
    const goal_num=req.body.goal_num;
    const is_anony= req.body.is_anony;
    const is_number= req.body.is_number;
    console.log(req.body);
    try{
        const data=await db.promise().query(`INSERT INTO post(student_id,title,text,category,goal_num,is_anony,is_number) VALUES(${student_id},'${title}','${text}','${category}','${goal_num}',${is_anony}, ${is_number})`);
        res.json({status:"success",text:"글 등록이 완료되었습니다."});

    }catch(e){
        
        console.log('addpost에서 error 발생!');
        console.log(e);
        res.status(400).json({ status: "fail" ,e});

    }


}

const editpost_nophoto= async function(req,res){
    const post_id = req.params.id;
    const student_id = req.decoded._id;
    const title= req.body.title;
    const text= req.body.text;
    const category=req.body.category;
    const goal_num=req.body.goal_num;
    const is_anony= req.body.is_anony;
    const is_number= req.body.is_number;
    try{
        const [checkID]= await db.promise().query(`select student_id from post where post_id=${post_id};`);
        console.log(checkID[0].student_id);
        if(checkID[0].student_id!=student_id){ //글 작성자 아닌경우
            res.json({status:"fail", text:"글 작성자만 수정이 가능합니다."});



        }else{
        await db
        .promise()
        .query(
          `UPDATE post SET title='${title}', text='${text}',goal_num=${goal_num},category='${category}',is_anony=${is_anony},is_number=${is_number}  WHERE post_id=${post_id};`
        );
        
        res.json({status:"success",text:"글 수정이 완료되었습니다."});
        }

    }catch(e){
        
        console.log('addpost에서 error 발생!');
        console.log(e);
        res.status(400).json({ status: "fail" ,e});

    }


}

const delpost = async function(req,res){
    const student_id=req.decoded._id;
    const post_id = req.params.id;

    try{
        const [checkID]= await db.promise().query(`select student_id from post where post_id=${post_id};`);
        if(checkID[0].student_id!=student_id){ //글 작성자 아닌경우
            res.json({status:"fail", text:"글 작성자만 삭제가 가능합니다."});
        }else{
            //삭제 로직.

            await db
            .promise()
            .query(`DELETE FROM post WHERE post_id=${post_id};`);

            res.json({status:"success",text:"글 삭제가 완료되었습니다."});
            //사진 추가시 사진 삭제 로직도 작성 해야함.
        }

    }catch(e){
        
        
        console.log(e);
        res.status(400).json({ status: "fail" ,e});

    }

    

}


//router.post("/search",searchpostbytitle);
router.get("/all",getALLpost);
router.get("/:id",getpost);
//ㄱouter.put("/edit/:id",editpost_nophoto);
//router.put("/edit/single/:id",upload.single("photo"),editpost_onephoto);
//router.put("/edit/multi/:id",upload.array("photo"),editpost_multiphoto);
router.delete("/delete/:id",verifyToken,delpost);
router.post("/add",verifyToken,addpost_nophoto); //사진 없을 때
router.put("/edit/:id",verifyToken,editpost_nophoto); //사진 없을 때
//router.post("/add/single",upload.single("photo"),addpost_onephoto); //사진 1개
//router.post("/add/multi",upload.array("photo"),addpost_multiphoto); //사진 2개 이상
module.exports = router;
