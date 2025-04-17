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
const fs = require('fs');

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
    const uploadDir = path.join(__dirname, 'resources/uploads');
    fs.mkdirSync(uploadDir, { recursive: true }); // Create directory if it doesn't exist
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

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

    console.log("Logged-in session user:", req.session.user);

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

// GET /profile route
app.get('/profile', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  try {
    const pic = await db.oneOrNone(
      'SELECT file_path FROM profile_pictures WHERE user_id = $1',
      [req.session.user.id]
    );

    if (pic) {
      req.session.user.profile_picture_path = pic.file_path;
    } else {
      req.session.user.profile_picture_path = '/resources/images/image.png';
    }

    const userSkills = await db.any(
      `SELECT s.id AS skill_id, s.skill_name, el.expertise_level
       FROM skills_to_users stu
       JOIN skills s ON stu.skill_id = s.id
       LEFT JOIN expertise_levels el ON el.skill_id = s.id AND el.user_id = $1
       WHERE stu.user_id = $1
       ORDER BY s.skill_name ASC`,
      [req.session.user.id]
    );

    const predefinedSkills = await db.any(
      `SELECT * FROM skills
       WHERE id NOT IN (
         SELECT skill_id FROM skills_to_users WHERE user_id = $1
       )
       ORDER BY skill_name ASC`,
      [req.session.user.id]
    );

    res.render('pages/profile', {
      user: req.session.user,
      skills: userSkills,
      predefinedSkills,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error fetching profile data:', error.message || error);

    res.render('pages/profile', {
      user: req.session.user,
      skills: [],
      predefinedSkills: [],
      message: 'An error occurred while loading the profile.',
      error: true
    });
  }
});



// POST /profile/edit route
app.post('/profile/edit', async (req, res) => {
  const { editValue, currentPassword, newPassword, field } = req.body;

  try {
    if (field === 'username') {
      // Update username
      await db.none('UPDATE users SET username = $1 WHERE id = $2', [editValue, req.session.user.id]);
      req.session.user.username = editValue; // Update session data
    } else if (field === 'email') {
      // Update email
      await db.none('UPDATE users SET email = $1 WHERE id = $2', [editValue, req.session.user.id]);
      req.session.user.email = editValue; // Update session data
    } else if (field === 'password') {
      // Validate current password
      const user = await db.one('SELECT * FROM users WHERE id = $1', [req.session.user.id]);
      const match = await bcrypt.compare(currentPassword, user.password);

      if (!match) {
        // Fetch skills and predefinedSkills to preserve page state
        const userSkills = await db.any(
          `SELECT s.id AS skill_id, s.skill_name, el.expertise_level
           FROM skills_to_users stu
           JOIN skills s ON stu.skill_id = s.id
           LEFT JOIN expertise_levels el ON el.skill_id = s.id AND el.user_id = $1
           WHERE stu.user_id = $1
           ORDER BY s.skill_name ASC`,
          [req.session.user.id]
        );

        const predefinedSkills = await db.any(
          `SELECT * FROM skills
           WHERE id NOT IN (
             SELECT skill_id FROM skills_to_users WHERE user_id = $1
           )
           ORDER BY skill_name ASC`,
          [req.session.user.id]
        );

        // Render the profile page with a localized error message and keep the password edit section open
        return res.render('pages/profile', {
          user: req.session.user,
          skills: userSkills,
          predefinedSkills,
          passwordError: 'Incorrect current password.',
          keepPasswordEditOpen: true, // Flag to keep the password edit section open
        });
      }

      // Update to new password
      const hash = await bcrypt.hash(newPassword, 10);
      await db.none('UPDATE users SET password = $1 WHERE id = $2', [hash, req.session.user.id]);
    }

    res.redirect('/profile');
  } catch (error) {
    console.error('Error updating profile:', error.message || error);
    res.render('pages/profile', {
      user: req.session.user,
      skills: [],
      predefinedSkills: [],
      message: 'An error occurred while updating your profile.',
      error: true,
    });
  }
});

// POST /profile/add-skill route
app.post('/profile/add-skill', async (req, res) => {
  const { skillId, expertiseLevel } = req.body;

  try {
    // Add the skill to the user
    await db.none(
      'INSERT INTO skills_to_users (user_id, skill_id) VALUES ($1, $2)',
      [req.session.user.id, skillId]
    );

    // Add the expertise level for the skill
    await db.none(
      'INSERT INTO expertise_levels (user_id, skill_id, expertise_level) VALUES ($1, $2, $3)',
      [req.session.user.id, skillId, expertiseLevel]
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
    // Remove the skill from the user
    await db.none(
      'DELETE FROM skills_to_users WHERE user_id = $1 AND skill_id = $2',
      [req.session.user.id, skillId]
    );

    // Remove the expertise level for the skill
    await db.none(
      'DELETE FROM expertise_levels WHERE user_id = $1 AND skill_id = $2',
      [req.session.user.id, skillId]
    );

    res.redirect('/profile');
  } catch (error) {
    console.error('Error removing skill:', error.message || error);
    res.redirect('/profile');
  }
});

// POST /profile/edit-skill route
app.post('/profile/edit-skill', async (req, res) => {
  const { skillId, expertiseLevel } = req.body;

  try {
    await db.none(
      'UPDATE expertise_levels SET expertise_level = $1 WHERE user_id = $2 AND skill_id = $3',
      [expertiseLevel, req.session.user.id, skillId]
    );
    res.status(200).send('Skill proficiency level updated successfully.');
  } catch (error) {
    console.error('Error updating skill proficiency level:', error.message || error);
    res.status(500).send('Failed to update skill proficiency level.');
  }
});

// POST /profile/upload-picture route
app.post('/profile/upload-picture', upload.single('profilePicture'), async (req, res) => {
  if (!req.session.user || !req.file) {
    return res.render('pages/profile', {
      user: req.session.user,
      message: 'No file uploaded or not logged in.',
      error: true
    });
  }

  try {
    const newFilePath = `/resources/uploads/${req.file.filename}`;

    // Get the old picture
    const old = await db.oneOrNone('SELECT file_path FROM profile_pictures WHERE user_id = $1', [req.session.user.id]);

    // Insert new or update existing
    await db.none(`
      INSERT INTO profile_pictures (user_id, file_path)
      VALUES ($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET file_path = $2, uploaded_at = CURRENT_TIMESTAMP
    `, [req.session.user.id, newFilePath]);

    // Delete old file (if it's not the default)
    if (old && old.file_path && !old.file_path.includes('/image.png')) {
      const fullPath = path.join(__dirname, old.file_path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    req.session.user.profile_picture_path = newFilePath;
    req.session.save(() => res.redirect('/profile'));

  } catch (error) {
    console.error('Upload error:', error);
    res.render('pages/profile', {
      user: req.session.user,
      message: `Upload failed: ${error.message}`,
      error: true
    });
  }
});


// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');