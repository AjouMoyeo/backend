const express = require('express');
const router =express.Router();
const jwt = require('jsonwebtoken');
const db= require('../database.js');
db.connect();
const multer= require('multer');
const verifyToken = require('./authMiddleware');
const { verify } = require('crypto');



const storage = multer.diskStorage({
    destination: function(req, file, callback){
        callback(null, 'photo/')
    },
    filename: function (req, file, callback) {
        callback(null, Date.now() + "-" + file.originalname);
      },
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

    const student_id =req.decoded._id;
    const id = req.params.id;
    try{
        const [post]= await db.promise().query(`SELECT * FROM post AS p JOIN student AS s ON p.student_id=s.student_id WHERE p.post_id=${id};`);
        const [photos]= await db.promise().query(`SELECT * FROM photo WHERE post_id=${id} ORDER BY is_thumbnail desc;`);
       // console.log(photos);
        post[0].photos= new Array();
        photos.forEach((photo)=>{
            post[0].photos.push(photo.url);
        })
        //console.log(post[0].title);
        const [is_joined]= await db.promise().query(`select count(*) as cnt FROM participant WHERE post_id=${id} AND student_id=${student_id}`)
        console.log("isjoined"+is_joined);
        //post.push({is_joined:is_joined[0].cnt});
        //console.log(post);
        res.send({status:"success",post,is_joined:is_joined[0].cnt});
    }catch(e){
        console.log('getpost에서 error 발생!');
        res.status(400).json({ status: "fail",e });
    }

}

const getALLpost =async function(req,res){
    //모든 post 가져오는ㄱ코드
    try{
        const [data] = await db.promise().query(`SELECT p.post_id, p.student_id,p.title, p.text,p.category,p.goal_num,p.cur_num, p.is_anony, p.is_number, p.created_at,s.name, s.nickname, ph.url,ph.is_thumbnail FROM post as p INNER JOIN student as s ON p.student_id=s.student_id LEFT JOIN photo as ph ON ph.post_id=p.post_id ORDER BY p.created_at ASC`);
        //console.log(data);
        res.json({status:"success",data});


    }catch(e){
        console.log(e);
        console.log('getALLpost에서 error 발생!');
        res.status(400).json({ status: "fail" ,e});
    }


}

const addpost_nophoto= async function(req,res){
    const data= JSON.parse(req.body.data);
    const student_id = req.decoded._id;
    const title= data.title;
    const text= data.text;
    const category=data.category;
    const goal_num=data.goal_num;
    const is_anony= data.is_anony;
    const is_number= data.is_number;
    console.log(req.body);
    try{

        //글 등록. 
        const [data]=await db.promise().query(`INSERT INTO post(student_id,title,text,category,goal_num,is_anony,is_number) VALUES(${student_id},'${title}','${text}','${category}','${goal_num}',${is_anony}, ${is_number})`); 
        //글 작성자도 참여자에 추가.
        const insert_id= data.insertId;
    
        await db.promise().query(`INSERT INTO participant(student_id, post_id) values(${student_id}, ${insert_id})`);
        res.json({status:"success",text:"글 등록이 완료되었습니다."});

        
    }catch(e){
        
        console.log('addpost에서 error 발생!');
        console.log(e);
        res.status(400).json({ status: "fail" ,e});

    }


}

const addpost_multiphoto= async function(req,res){  
    const photos = req.files;
    const data= JSON.parse(req.body.data);
    const student_id = req.decoded._id;
    const title= data.title;
    const text= data.text;
    const category=data.category;
    const goal_num=data.goal_num;
    const is_anony= data.is_anony;
    const is_number= data.is_number;
    
    try{
        //게시글 저장.
        const [data] = await db
        .promise()
        .query(
          `INSERT INTO post(student_id,title,category,goal_num,text,is_anony,is_number) VALUES(${student_id},'${title}','${category}',${goal_num},'${text}',${is_anony},${is_number} )`
        );
        //사진 저장
        console.log(data.insertId);
        const insertid = data.insertId;
        console.log("파일 여러개 " + photos.length);
        photos.forEach(async (photo, idx) => {
            const photo_url = `/photo/${photo.filename}`;
            console.log(photo_url);
            const [photo_data] = await db
            .promise()
            .query(
                `INSERT INTO photo (post_id,url) VALUES(${insertid},'${photo_url}');`
            );
        if (idx == 0) {
          // 첫번째 사진을 Thumbnail 이미지로 변경.
          await db
            .promise()
            .query(`UPDATE photo SET is_thumbnail=1 WHERE url='${photo_url}';`);
        }

        
      });
      //글 작성자 판매자로 추가
      await db.promise().query(`INSERT INTO participant(student_id, post_id) values(${student_id}, ${insertid})`);
  
      res.json({ status: "success" ,text:"글 작성을 완료하였습니다."});

    }catch(e){
        console.log(e);
        res.status(400).json({ status: "fail" ,e});

    }


}

const editpost_nophoto= async function(req,res){
    const data= JSON.parse(req.body.data);
    const post_id = req.params.id;
    const student_id = req.decoded._id;
    const title= data.title;
    const text= data.text;
    const category=data.category;
    const goal_num=data.goal_num;
    const is_anony= data.is_anony;
    const is_number= data.is_number;
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
const editpost_multiphoto=async function(req,res){
    const data= JSON.parse(req.body.data);
    const photos = req.files;
    const post_id = req.params.id;
    const student_id = req.decoded._id;
    const title= data.title;
    const text= data.text;
    const category=data.category;
    const goal_num=data.goal_num;
    const is_anony= data.is_anony;
    const is_number= data.is_number;
    console.log(req.files);
    console.log("edit multi");
    try{
        const [checkID]= await db.promise().query(`select student_id from post where post_id=${post_id};`);
        if(checkID[0].student_id!=student_id){
          res.json({status:"fail",text:"글 작성자만 수정이 가능합니다."});
        }
        else{
            if(req.files.length  ==0 ){
                //수정했는데 사진이 없는경우
                console.log("no_photo");
                await db.promise().query(
                    `UPDATE post SET title='${title}', text='${text}',goal_num=${goal_num},category='${category}',is_anony=${is_anony},is_number=${is_number} WHERE post_id=${post_id};`)
                res.json({status:"success",text:"글 수정이 완료되었습니다."});


            }
            else{
                await db.promise().query(`DELETE from photo where post_id=${post_id};`); //본래 있던 사진 삭제.
                photos.forEach(async (photo, idx) => {
                    const photo_url = `/photo/${photo.filename}`;
                    console.log(photo_url);
                    await db
                    .promise()
                    .query(
                        `INSERT INTO photo (post_id,url) VALUES(${post_id},'${photo_url}');`);
                    if (idx == 0) {
                    // 첫번째 사진을 Thumbnail 이미지로 변경.
                        await db
                            .promise()
                            .query(`UPDATE photo SET is_thumbnail=1 WHERE url='${photo_url}';`);
                    }
                })
                await db.promise().query(
                    `UPDATE post SET title='${title}', text='${text}',goal_num=${goal_num},category='${category}',is_anony=${is_anony},is_number=${is_number} WHERE post_id=${post_id};`)
                    res.json({status:"success",text:"글 수정이 완료되었습니다."});

            }
            
        }
    }catch(e){
        console.log(e);
        res.json({status:"fail",text:"오류"});

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

const join = async function(req,res){
    const student_id=req.decoded._id;
    const post_id = req.params.postid;

    try{

        // 1. 이미 참여했는지 확인 후 참여하지 않았다면 참여 진행.

        const [result] = await db.promise().query(`select student_id from participant where post_id =${post_id} and student_id=${student_id}`);
        console.log(result[0]);
        if (result[0]==undefined){
            await db.promise().query(`insert into participant(student_id,post_id) values(${student_id},${post_id})`);
            await db.promise().query(`update post set cur_num=cur_num+1 where post_id=${post_id}`);
            
            res.json({status:"success",text:"모임에 참여하였습니다."});
        }
        else{ //이미 참여 했던 경우
            res.json({status:"fail", text:"이미 모임에 참여하였습니다."});

        }

    }catch(e){
        
        
        console.log(e);
        res.status(400).json({ status: "fail" ,e});

    }
}
const leave = async function(req,res){
    const student_id=req.decoded._id;
    const post_id = req.params.postid;
    try{
        const [result] = await db.promise().query(`select student_id from participant where post_id =${post_id} and student_id=${student_id}`);
        console.log(result[0]);
        if (result[0]==undefined){
            
            res.json({status:"fail", text:"모임에 참여하지 않아 취소 할 수 없습니다."});
        }
        else{ //이미 참여 했던 경우
            await db.promise().query(`delete from participant where post_id =${post_id} and student_id=${student_id}`);
            await db.promise().query(`update post set cur_num=cur_num-1 where post_id=${post_id}`);
            res.json({status:"success",text:"모임 참여를 취소하였습니다."});
        }

    }catch(e){
        console.log(e);
        res.status(400).json({ status: "fail" ,e});
    }
}



//router.post("/search",searchpostbytitle);
router.get("/",getALLpost);
router.get("/:id",verifyToken,getpost);
router.delete("/:id",verifyToken,delpost);
router.post("/",addpost_nophoto); //사진 없을 때
router.post("/multi",verifyToken,upload.array("photo"),addpost_multiphoto); //사진 2개 이상
router.put("/:id",verifyToken,editpost_nophoto); //사진 없을 때
router.put("/multi/:id",verifyToken,upload.array("photo"),editpost_multiphoto);

router.get("/join/:postid",verifyToken , join);
router.get("/leave/:postid",verifyToken , leave);
module.exports = router;