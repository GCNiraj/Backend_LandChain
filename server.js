const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config({path:'./config.env'})
const app = require('./app')

const DB = process.env.DATABASE.replace(
    'PASSWORD',
    process.env.DATABASE_PASSWORD,
)
const local_DB = process.env.DATABASE_LOCAL
// console.log(process.env.DATABASE_PASSWORD)
mongoose.connect(DB).then((con) => {
    // console.log(con.conections)
    console.log('DB connection succesful')
}).catch(error => console.log(error));

/* Starting the port on port 4001. */
const port = 4001
app.listen(port, ()=>{
    console.log(`App running on port ${port} ..`)
})