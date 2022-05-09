const express = require('express');
const router =express.Router();
const jwt = require('jsonwebtoken');
const db= require('../database.js');
db.connect();
const multer= require('multer');

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
        const [post]= await db.promise().query(`SELECT p.postid, u.nickname, p.title,p.explained, p.created_at FROM posts AS p JOIN users AS u ON p.userid=u.userid WHERE p.postid=${id};`);
        const [photos]= await db.promise().query(`SELECT * FROM photos WHERE postid=${id} ORDER BY thumbnail desc;`);
        console.log[photos];
        post[0].photos= new Array();
        photos.forEach((photo)=>{
            post[0].photos.push(photo.url);

        })
        console.log(post[0].title);
        const [comments]= await db.promise().query(`SELECT * FROM comments WHERE postid=${id}`);
        comments.map((e)=> {
            var temp= new Object();
            temp.postid=e.postid;
            temp.userid=e.userid;
            temp.created_at=e.created_at;
            temp.comments=e.comments;
            temp.nickname=e.nickname;
            temp = JSON.stringify(temp);
            post.push(JSON.parse(temp));
        })
        console.log(post);
        res.send(post);
    }catch{
        console.log('getpost에서 error 발생!');
        res.status(400).json({ status: "fail" });
    }

}

const getALLpost =async function(req,res){
    //모든 post 가져오는ㄱ코드
    try{
        const [data] = await db.promise().query(`SELECT p.title, p.explained, p.created_at, u.userid, u.nickname, ph.url FROM posts as p INNER JOIN users as u ON p.userid=u.userid LEFT JOIN photos as ph ON ph.postid=p.postid where thumbnail=1 ORDER BY p.created_at DESC`);
        //console.log(data);
        res.json(data);


    }catch(e){
        console.log(e);
        console.log('getALLpost에서 error 발생!');
        res.status(400).json({ status: "fail" });
    }


}

const addpost_nophoto= async function(req,res){
    const userid=req.body.userid;
    const title= req.body.title;
    const explained= req.body.explained;
    console.log(req.body);
    try{
        const data=await db.promise().query(`INSERT INTO posts(userid,title,explained) VALUES(${userid},'${title}','${explained}')`);
        res.json({status:"success"});

    }catch(e){
        
        console.log('addpost에서 error 발생!');
        console.log(e);
        res.status(400).json({ status: "fail" });

    }


}

const editpost = async function(req,res){


}

const delpost = async function(req,res){
    

}


router.post("/search",searchpostbytitle);
router.get("/all",getALLpost);
router.get("/:id",getpost);
router.put("/edit/:id",editpost_nophoto);
router.put("/edit/single/:id",upload.single("photo"),editpost_onephoto);
router.put("/edit/multi/:id",upload.array("photo"),editpost_multiphoto);
router.delete("/delete/:id",delpost);
router.post("/add",addpost_nophoto); //사진 없을 때
router.post("/add/single",upload.single("photo"),addpost_onephoto); //사진 1개
router.post("/add/multi",upload.array("photo"),addpost_multiphoto); //사진 2개 이상
module.exports = router;
