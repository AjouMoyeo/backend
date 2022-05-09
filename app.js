const express = require('express')
  , http = require('http');
const cors = require('cors');
const { swaggerUi, specs } = require('./swagger');



const bodyParser= require("body-parser");
const auth = require("./routes/auth");
require("dotenv").config();
var app = express();
app.use(cors());
app.set('port', process.env.server_port|| 3000);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));


app.use("/auth",auth);
var server = http.createServer(app).listen(app.get('port'), function(){

	//const dir= './photo';
	//if( !fs.existsSync(dir)) fs.mkdirSync(dir);
	console.log('서버가 시작되었습니다. 포트 : ' + app.get('port'));
   
});