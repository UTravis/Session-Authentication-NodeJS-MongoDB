const express = require('express')
const session = require('express-session')
const mongoose = require("mongoose")
const MongoStore =  require("connect-mongo")
const ejs = require("ejs")
const User = require('./models/User')
const bcrypt = require("bcryptjs")
const auth = require('./middleware/auth')


mongoose.connect("mongodb://localhost:27017/authDB", () => {
    console.log("Connected")
}).catch(err => console.log(err))

const app = express()
const port = 3000

app.set("view engine", 'ejs');

const store = new MongoStore({
    mongoUrl: "mongodb://localhost:27017/authDB",
    collectionName: "session",
})

app.use(express.urlencoded({extended: true}))

app.use(session({
    secret: '23423BENRER3',
    resave: false,
    saveUninitialized: false,
    store: store
}))

app.listen(port, () => console.log(`Application listening on port ${port}!`))

// ROUTES

app.get('/', (req, res) => {
    res.redirect('/register');
})


/******Registration Routes****/
app.get('/register', (req, res) => {
    res.render('registration')
})


app.post('/register', async (req, res) => {
    //Checking if email already exists
    const isUser = await User.findOne({email : req.body.email});
    if(isUser) return res.redirect('/register');

    //Hashing passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    //creating new user instance
    const user = new User({
        username : req.body.username,
        email : req.body.email,
        password : hashedPassword
    })

    try {
        await user.save();
        res.redirect('/login');
    } catch (error) {
        console.log(error);
        res.send("Opps could not create your account")
    }
})

/***** END***** */


/***** Login Routes ******/
app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/login', async (req, res) => {
    //Checks if user exists
    const user = await User.findOne({email: req.body.email});
    if(! user) return res.send("User not found!!!");

    //verify password
    const isVerified = await bcrypt.compare(req.body.password, user.password);
    if(! isVerified) return res.send("Password is incorrect!!");

    //setting session
    req.session.isAuth = true;
    req.session._id = user._id;

    //redirects to dashboard
    res.redirect('/dashboard')
})
/****** END *********** */



app.get('/dashboard', auth, async (req, res) => {
    const id = req.session._id;
    const user = await User.findById(id);
    res.render('dashboard', {user});
})


/****** LOGOUT *******/
app.get('/logout', (req, res) => {
    //destroy session
    req.session.destroy( (err) => {
        if(err) throw err;
        res.redirect('/login')
    })
})
/******** END *********/