const express = require('express')
  , path = require("path"),
  fs=require('fs');
const static = require("serve-static");
const cors = require('cors');
const { swaggerUi, specs } = require('./swagger');


// 여기서 socket은 개인 사용자 자신을 나타냄.





const bodyParser= require("body-parser");
const auth = require("./routes/student");
const post = require("./routes/post");

const db= require('./database.js');
const { response } = require('express');
require("dotenv").config();
var app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
app.use(cors());
app.set('port', process.env.server_port|| 3000);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));


app.use("/auth",auth);
app.use("/post",post);

app.use("/photo", static(path.join(__dirname, "photo")));


io.on('connection', (socket) => {
	db.connect();
	console.log("db연결 완료");
	console.log("socket 연결 성공 ");
	socket.on('leaveRoom', async (user_id , post_id, name) => {
		const time = new Date();
		const roomName = post_id;
		await db.promise().query(`delete from room where post_id=${roomName} and user_id=${user_id} `);

		socket.leave(roomName, () => {
		console.log(name + ' leave a ' + roomName);
		io.to(roomName).emit('leaveRoom', user_id,post_id,name,time);
		});
	});
  
  
	socket.on('joinRoom', async (user_id , post_id, name) => {
		const time = new Date();
		const roomName = post_id;
		try{
			const [result] = await db.promise().query(`select student_id from room where post_id=${post_id} and student_id=${user_id}`);
			if (result[0].student_id !=userid) { //이미 참여 했던 유저.
				await db.promise().query(`insert into room(post_id,student_id) values(${user_id}, ${post_id})`); //db에 유저가 채팅방에 들어왔다는 내용 저장.
				const msg= `${name}님이 채팅방에 들어왔습니다.`
				await db.promise().query(`insert into chat (SENDER_ID, ROOM_ID,MESSAGE) values(${user_id}, ${post_id},'${msg}'})`); //db에 유저가 채팅방에 들어왔다는 내용 저장.
			}
			socket.join(roomName, async () => {
				console.log(name + ' join a ' + room[post_id]);
				io.to(post_id).emit('joinRoom', num, name,time);
			});
			
		}
		catch(e){
			console.log(e);
		}
	});

  
	socket.on('chat_message', async (user_id, post_id , name, msg) => {
	  const roomName = post_id;
	  const time = new Date();
	  await db.promise().query(`insert into chat (SENDER_ID, ROOM_ID,MESSAGE) values(${user_id}, ${post_id},'${msg}'})`); //db에 유저가 채팅방에 들어왔다는 내용 저장.
	  io.to(roomName).emit('chat message', user_id,post_id,time,name, msg);
	});
	socket.on('disconnect', async () => {
	  console.log('user disconnected');
	});

	// socket.on("JOIN_ROOM",(name,roomNumber)=>{
	// 	socket.join(roomName);
	// 	const responseData = {
	// 		...req,
	// 		type: "JOIN_ROOM",
	// 		time: new Date(),
	// 	};
	// 	io.to(roomName).emit("RECEIVE_MESSAGE",responseData);
	// 	console.log("JOIN ROOM 실행")
	// 	console.log(responseData);


	// });
	
	// socket.on("SEND_MESSAGE", requestData => {
	// 	const responseData = {
	// 	  ...requestData,
	// 	  type: "SEND_MESSAGE",
	// 	  time: new Date(),
	// 	};
	// 	socketIo.to(roomName).emit("RECEIVE_MESSAGE", responseData);
	// 	console.log(`SEND_MESSAGE is fired with data: ${JSON.stringify(responseData)}`);
	//   });
	
  });
var server = http.listen(app.get('port'), function(){
	const dir= './photo';
	if( !fs.existsSync(dir)) fs.mkdirSync(dir);
	console.log('서버가 시작되었습니다. 포트 : ' + app.get('port'));
});