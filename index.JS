const express = require ('express')
const path = require('path')
const exphbs = require(express-handlebars)
const app = express()

const port= process.env.port


app.engine(
'hbs',
exphbs.engine({
    extname: 'hbs',
    partialsDir: path.join(__dirname, 'views/partials'),
     defaultLayout: 'inicio.hbs',
    layoutsDir: path.join(__dirname, 'views/layouts')
  
})
);




