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
const multer = require('multer'); // To handle file uploads

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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'resources/uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

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
    console
.log(sched);

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
    const existingUser = await db.oneOrNone(
      'SELECT 1 FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)',
      [username, email]
    );
    
    if (existingUser) {
      return res.status(409).json({
        message: 'Username or email already exists.',
        error: true,
      });
    }
    

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.none(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)',
      [username, email, hashedPassword]
    );

    console.log(`Registered new user: ${username}`);
    res.redirect('/login');
  } catch (error) {
    console.error('Registration error:', error);
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
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)',
      [username]
    );

    if (!user) {
      return res.render('pages/login', {
        message: 'Username or email not found. Please register.',
        error: true,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Incorrect username/email or password.',
        error: true,
      });
    }
    

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    req.session.save(() => {
      console.log(`Logged in as ${user.username}`);
      res.status(200).json({ message: 'Login successful', user: req.session.user });
    });
  } catch (error) {
    console.error('Login error:', error);
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

// GET /profile route
app.get('/profile', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const skills = await db.any('SELECT * FROM skills WHERE user_id = $1', [req.session.user.id]);
    const predefinedSkills = await db.any('SELECT * FROM skills WHERE user_id IS NULL');

    console.log('Test');
    console.log('User Skills:', skills); // Debugging user-specific skills
    console.log('Predefined Skills:', predefinedSkills); // Debugging predefined skills

    res.render('pages/profile', { user: req.session.user, skills, predefinedSkills });
  } catch (error) {
    console.error('Error fetching skills:', error.message || error);
    res.render('pages/profile', { user: req.session.user, skills: [], predefinedSkills: [], error: true });
  }
});

// POST /profile/edit route
app.post('/profile/edit', async (req, res) => {
  const { editValue, currentPassword, newPassword } = req.body;

  try {
    if (req.body.username) {
      // Update username
      await db.none('UPDATE users SET username = $1 WHERE id = $2', [editValue, req.session.user.id]);
      req.session.user.username = editValue; // Update session data
    } else if (req.body.email) {
      // Update email
      await db.none('UPDATE users SET email = $1 WHERE id = $2', [editValue, req.session.user.id]);
      req.session.user.email = editValue; // Update session data
    } else if (req.body.password) {
      // Update password
      const user = await db.one('SELECT * FROM users WHERE id = $1', [req.session.user.id]);
      const match = await bcrypt.compare(currentPassword, user.password);

      if (!match) {
        return res.render('pages/profile', { user: req.session.user, message: 'Incorrect current password.', error: true });
      }

      const hash = await bcrypt.hash(newPassword, 10);
      await db.none('UPDATE users SET password = $1 WHERE id = $2', [hash, req.session.user.id]);
    }

    res.redirect('/profile');
  } catch (error) {
    console.error('Error updating profile:', error.message || error);
    res.render('pages/profile', { user: req.session.user, message: 'An error occurred.', error: true });
  }
});

// POST /profile/add-skill route
app.post('/profile/add-skill', async (req, res) => {
  const { skillName, expertiseLevel } = req.body;

  try {
    await db.none(
      'INSERT INTO skills (user_id, skill_name, expertise_level) VALUES ($1, $2, $3)',
      [req.session.user.id, skillName, expertiseLevel]
    );
    res.redirect('/profile');
  } catch (error) {
    console.error('Error adding skill:', error.message || error);
    res.redirect('/profile');
  }
});

// POST /profile/remove-skill route
app.post('/profile/remove-skill', async (req, res) => {
  const { skillId } = req.body;

  try {
    await db.none('DELETE FROM skills WHERE id = $1 AND user_id = $2', [skillId, req.session.user.id]);
    res.redirect('/profile');
  } catch (error) {
    console.error('Error removing skill:', error.message || error);
    res.redirect('/profile');
  }
});

// POST /profile/upload-picture route
app.post('/profile/upload-picture', upload.single('profilePicture'), async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const filePath = `/resources/uploads/${req.file.filename}`;
    const result = await db.one(
      'INSERT INTO profile_pictures (user_id, file_path) VALUES ($1, $2) RETURNING id',
      [req.session.user.id, filePath]
    );

    await db.none('UPDATE users SET profile_picture_id = $1 WHERE id = $2', [result.id, req.session.user.id]);
    req.session.user.profile_picture_path = filePath;

    res.redirect('/profile');
  } catch (error) {
    console.error('Error uploading profile picture:', error.message || error);
    res.render('pages/profile', { message: 'An error occurred.', error: true });
  }
});

// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');
