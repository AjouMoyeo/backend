const maria = require('mysql2');
require('dotenv').config();
const DBconnection= maria.createConnection({
        host:process.env.db_host,
        port:process.env.db_port,
        user:process.env.db_user,
        password:process.env.db_pw,
        database:process.env.db_name
});

console.log("DB Connect Success");
module.exports= DBconnection;