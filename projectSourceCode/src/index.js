// Copied code from Evan's Lab 8 to use as a skeleton for the project

// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the   Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcryptjs'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part C.

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});

// database configuration
const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// Serve static files from /src/resources
app.use('/resources', express.static(path.join(__dirname, 'resources')));

// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************

app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});

app.use(function (req, res, next) {
  res.locals.user = req.session.user;
  next();
});

app.get('/', (req, res) => {
  res.render('pages/home', { user: req.session.user }); 
});




app.post('/scheduleevent', (req, res) => {


  //res.render('pages/scheduling');



  console.log(req.body.evname);
  console.log(req.body.days);
  console.log(req.body.modality);

  console.log(req.body.location);
  console.log(req.body.attendees);
  


  db.tx(async t => {
    await t.none(
      "INSERT INTO eventts (schedday, eventname, modality, eventlocation) VALUES ($1,$2,$3,$4);",
      [req.body.days, req.body.evname, req.body.modality, req.body.location]
    );




  const sched = await db.any(
    'SELECT * FROM eventts;',
  
  );

  console.log(sched)


  res.render('pages/scheduling', {
    events: sched,
   
  })




})




});


app.get('/findevents', (req, res) => {

  db.tx(async t => {

  const sched = await db.any(
    'SELECT * FROM eventts;', );


    console.log(sched);

    res.render('pages/scheduling', {
      events: sched,
     
    })


})





});


app.get('/about', (req, res) => {
  res.render('pages/about');
});
  
// GET /register route
app.get('/register', (req, res) => {
  res.render('pages/register');
});

// POST /register route
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if username or email already exists
    const userExists = await db.oneOrNone(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (userExists) {
      return res.render('pages/register', {
        message: 'Username or email already exists.',
        error: true,
      });
    }

    const hash = await bcrypt.hash(password, 10);

    await db.none(
      'INSERT INTO users(username, email, password) VALUES($1, $2, $3)',
      [username, email, hash]
    );

    res.redirect('/login');
  } catch (error) {
    console.error('Error during registration:', error.message || error);
    res.render('pages/register', {
      message: 'An error occurred during registration.',
      error: true,
    });
  }
});

// GET /scheduling route
app.get('/scheduling', (req, res) => {
  res.render('pages/scheduling');
});


// GET /login route
app.get('/login', (req, res) => {
  res.render('pages/login');
});

// POST /login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await db.oneOrNone(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (!user) {
      return res.render('pages/login', {
        message: 'Username not found. Please register first.',
        error: true,
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.render('pages/login', {
        message: 'Incorrect username or password.',
        error: true,
      });
    }

    req.session.user = user;
    req.session.save(() => {
      res.redirect('/');
    });
  } catch (error) {
    console.error('Error during login:', error.message || error);
    res.render('pages/login', {
      message: 'An error occurred during login.',
      error: true,
    });
  }
});

//GET /logout route
app.get('/logout', (req, res) => {
  // Destroy the session
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err.message || err);
      return res.render('pages/logout', {
        message: 'An error occurred during logout.',
        error: true,
      });
    }

    // Render the logout.hbs page with a success message
    res.render('pages/logout', {
      message: 'Logged out successfully.',
      error: false,
    });
  });
});
// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');
