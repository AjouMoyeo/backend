const swaggerUi = require('swagger-ui-express'); 
const swaggereJsdoc = require('swagger-jsdoc'); 
const options = { swaggerDefinition: { info: { title: '아주모여 API', version: '1.0.0', description: '아주모여 API 명세서', }, host: 'localhost:3000', basePath: '/' }, apis: ['./routes/*.js', './swagger/*'] }; 
const specs = swaggereJsdoc(options); 
module.exports = { swaggerUi, specs };

