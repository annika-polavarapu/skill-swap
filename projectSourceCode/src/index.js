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
const cron = require('node-cron'); // To schedule tasks
const moment = require('moment-timezone');
const http = require('http');
const { Server } = require('socket.io');

// Register the formatDate helper
Handlebars.registerHelper('formatDate', function (date, format) {
  return moment(date).tz('America/Denver').format(format);
});

// Register the neq helper
Handlebars.registerHelper('neq', function (a, b) {
  return a !== b;
});

// Register the eq helper
Handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});

// Register the set helper
Handlebars.registerHelper('set', function (varName, varValue, options) {
  if (!options.data.root) {
    options.data.root = {};
  }
  options.data.root[varName] = varValue;
});

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
  host: process.env.POSTGRES_HOST || 'db', // the database server
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
app.set('view engine', 'hbs');// Update the views path for Render
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
  res.render('pages/home', { 
    user: req.session.user,
    title: 'Home | '
  });
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
      "INSERT INTO events (schedday, eventname, modality, eventlocation, eventtime, attendees, eventurl ) VALUES ($1,$2,$3,$4,$5,$6,$7);",
      [req.body.days, req.body.evname, req.body.modality, req.body.location, req.body.event_time, req.body.attendees, req.body.remotename]
    );

    const sched = await db.any(
      'SELECT * FROM events;',
    );

    console.log(sched)

    console.log("REMOTE NAME:")
    console.log(req.body.remotename)
    console.log("REMOTE URL")
    console.log(req.body.remoteurl)


  res.render('pages/scheduling', {
    events: sched,
   
  })

  
 

})




});


app.get('/findevents', (req, res) => {



  db.tx(async t => {
    const sched = await db.any(
      'SELECT * FROM events;', );
    console
.log(sched);

    res.render('pages/scheduling', {
      events: sched,
    
    })


})





});


app.get('/about', (req, res) => {
  res.render('pages/about', { title: 'About | ' });
});
  
// GET /register route
app.get('/register', (req, res) => {
  res.render('pages/register', { title: 'Register | ' });
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


  console.log("Logged-in session user:", req.session.user);

  if(req.session.user==null){
    res.render('pages/login');
  
    }else{

      res.render('pages/scheduling');

    }
 
});


// GET /login route
app.get('/login', (req, res) => {
  res.render('pages/login', { title: 'Login | ' });
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
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    // Fetch the user's profile picture
    const pic = await db.oneOrNone(
      'SELECT file_path FROM profile_pictures WHERE user_id = $1',
      [req.session.user.id]
    );

    // Set the profile picture path in the session
    if (pic) {
      req.session.user.profile_picture_path = pic.file_path;
    } else {
      req.session.user.profile_picture_path = '/resources/images/image.png'; // Default profile picture
    }

    // Fetch user's skills and their expertise levels, sorted alphabetically
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

    // Render the profile page
    return res.render('pages/profile', {
      user: req.session.user,
      title: 'Profile |',
      skills: userSkills,
      predefinedSkills,
      timestamp: Date.now(), // Add timestamp for cache-busting
    });
  } catch (error) {
    console.error('Error fetching profile data:', error.message || error);

    res.render('pages/profile', {
      user: req.session.user,
      skills: [],
      predefinedSkills: [],
      message: 'An error occurred while loading the profile.',
      error: true,
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

app.get('/matching', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    // Fetch all predefined skills for the dropdown
    const predefinedSkills = await db.any('SELECT * FROM skills ORDER BY skill_name ASC');
    res.render('pages/matching', { predefinedSkills });
  } catch (error) {
    console.error('Error loading matching page:', error.message || error);
    res.render('pages/matching', { message: 'Error loading matching page.', error: true });
  }
});

app.post('/matching', async (req, res) => {
  const { skillId } = req.body;

  try {
    console.log('Skill ID:', skillId);

    // Add the skill to the user's learning goals
    await db.none(
      'INSERT INTO learning_goals (user_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.session.user.id, skillId]
    );

    // Find matching users
    const matches = await db.any(
      `SELECT DISTINCT ON (u.id) u.id, u.username, u.email, pp.file_path AS profile_picture_path, s.skill_name, el.expertise_level, ms.skill_name AS mutual_skill
       FROM skills_to_users stu
       JOIN users u ON stu.user_id = u.id
       LEFT JOIN profile_pictures pp ON pp.user_id = u.id
       JOIN skills s ON stu.skill_id = s.id
       JOIN expertise_levels el ON el.skill_id = s.id AND el.user_id = u.id
       JOIN learning_goals lg ON lg.user_id = u.id
       JOIN skills ms ON ms.id = lg.skill_id
       WHERE stu.skill_id = $1 AND lg.skill_id IN (
         SELECT skill_id FROM skills_to_users WHERE user_id = $2
       ) AND u.id != $2`,
      [skillId, req.session.user.id]
    );

    // Fetch predefined skills for the dropdown
    const predefinedSkills = await db.any('SELECT * FROM skills ORDER BY skill_name ASC');

    // Determine if there are no matches
    const noMatches = matches.length === 0;

    // Pass matches, predefinedSkills, and noMatches to the template
    res.render('pages/matching', { predefinedSkills, matches, noMatches });
  } catch (error) {
    console.error('Error finding matches:', error.message || error);
    res.redirect('/matching');
  }
});

// POST /connect route
app.post('/connect', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const { userId } = req.body;

  try {
    console.log('Connecting user:', req.session.user.id, 'with user:', userId);

    // Check if a chat already exists between the two users
    const chat = await db.oneOrNone(
      `SELECT * FROM chats 
       WHERE (user1_id = $1 AND user2_id = $2) 
          OR (user1_id = $2 AND user2_id = $1)`,
      [req.session.user.id, userId]
    );

    // If no chat exists, create a new one
    if (!chat) {
      console.log('No existing chat found. Creating a new chat...');
      await db.none(
        `INSERT INTO chats (user1_id, user2_id, created_at) 
         VALUES ($1, $2, NOW())`,
        [req.session.user.id, userId]
      );
    } else {
      console.log('Chat already exists:', chat);
    }

    // Redirect to the messaging page
    res.redirect('/messaging');
  } catch (error) {
    console.error('Error connecting users:', error.message || error);
    res.redirect('/matching');
  }
});

// GET /messaging route
app.get('/messaging', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const { chatId } = req.query;

  try {
    // Fetch all chats for the logged-in user
    const chats = await db.any(
      `SELECT c.id AS chat_id, 
              u.id AS user_id, 
              u.username, 
              pp.file_path AS profile_picture_path, 
              MAX(m.created_at) AS last_message_time
       FROM chats c
       JOIN users u ON (u.id = c.user1_id AND c.user2_id = $1) 
                  OR (u.id = c.user2_id AND c.user1_id = $1)
       LEFT JOIN profile_pictures pp ON pp.user_id = u.id
       LEFT JOIN messages m ON m.chat_id = c.id
       GROUP BY c.id, u.id, u.username, pp.file_path
       ORDER BY last_message_time DESC NULLS LAST`,
      [req.session.user.id]
    );

    // Redirect to the top chat if no chatId is provided and there are chats
    if (!chatId && chats.length > 0) {
      return res.redirect(`/messaging?chatId=${chats[0].chat_id}`);
    }

    let messages = [];
    let chatUser = null;

    if (chatId) {
      // Fetch messages for the selected chat
      const rawMessages = await db.any(
        `SELECT m.content, m.created_at, m.sender_id, u.username 
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.chat_id = $1
         ORDER BY m.created_at ASC`,
        [chatId]
      );

      // Group messages by date
      let lastDate = null;
      messages = rawMessages.map((message) => {
        const currentDate = moment(message.created_at).tz('America/Denver').format('YYYY-MM-DD');
        const showDateSeparator = currentDate !== lastDate;
        lastDate = currentDate;
        return {
          ...message,
          showDateSeparator,
          formattedDate: moment(message.created_at).tz('America/Denver').format('MMMM DD, YYYY'),
          formattedTime: moment(message.created_at).tz('America/Denver').format('HH:mm'),
        };
      });

      // Fetch the user details of the other participant in the chat
      chatUser = await db.oneOrNone(
        `SELECT u.id, u.username, pp.file_path AS profile_picture_path
         FROM chats c
         JOIN users u ON (u.id = c.user1_id AND c.user2_id = $1) 
                    OR (u.id = c.user2_id AND c.user1_id = $1)
         LEFT JOIN profile_pictures pp ON pp.user_id = u.id
         WHERE c.id = $2`,
        [req.session.user.id, chatId]
      );
    }

    // Render the messaging page
    res.render('pages/messaging', { chats, messages, chatUser, chatId });
  } catch (error) {
    console.error('Error loading messaging page:', error.message || error);
    res.render('pages/messaging', { chats: [], messages: [], chatUser: null, chatId: null, message: 'Error loading messages.', error: true });
  }
});

// GET /messaging/messages route
app.get('/messaging/messages', async (req, res) => {
  const { chatId } = req.query;

  try {
    const rawMessages = await db.any(
      `SELECT m.content, m.created_at, m.sender_id, u.username 
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.chat_id = $1
       ORDER BY m.created_at ASC`,
      [chatId]
    );

    // Group messages by date
    let lastDate = null;
    const messages = rawMessages.map((message) => {
      const currentDate = moment(message.created_at).tz('America/Denver').format('YYYY-MM-DD');
      const showDateSeparator = currentDate !== lastDate;
      lastDate = currentDate;
      return {
        ...message,
        showDateSeparator,
        formattedDate: moment(message.created_at).tz('America/Denver').format('MMMM DD, YYYY'),
        formattedTime: moment(message.created_at).tz('America/Denver').format('HH:mm'),
      };
    });

    res.render('partials/messages', { messages, layout: false });
  } catch (error) {
    console.error('Error fetching messages:', error.message || error);
    res.status(500).send('Error fetching messages');
  }
});

// POST /messaging/send route
app.post('/messaging/send', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const { chatId, message } = req.body;

  try {
    // Insert the new message into the messages table
    await db.none(
      `INSERT INTO messages (chat_id, sender_id, content, created_at) 
       VALUES ($1, $2, $3, NOW())`,
      [chatId, req.session.user.id, message]
    );

    // Redirect back to the messaging page with the same chat
    res.redirect(`/messaging?chatId=${chatId}`);
  } catch (error) {
    console.error('Error sending message:', error.message || error);
    res.redirect('/messaging');
  }
});

// POST /messaging/delete route
app.post('/messaging/delete', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const { chatId } = req.body;

  try {
    // Delete the chat and its associated messages
    await db.none('DELETE FROM chats WHERE id = $1', [chatId]);
    res.redirect('/messaging');
  } catch (error) {
    console.error('Error deleting chat:', error.message || error);
    res.redirect('/messaging');
  }
});

app.use('/resources', express.static(path.join(__dirname, 'resources')));

// *****************************************************
// <!-- Section 5 : Scheduled Tasks -->
// *****************************************************

// Schedule a weekly cleanup task (runs every Sunday at midnight)
cron.schedule('0 0 * * 0', async () => {
  try {
    await db.none('DELETE FROM learning_goals WHERE created_at < NOW() - INTERVAL \'7 days\'');
    console.log('Old learning goals cleared.');
  } catch (error) {
    console.error('Error clearing old learning goals:', error.message || error);
  }
});

// *****************************************************
// <!-- Section 6 : Start Server-->
// *****************************************************

// Create an HTTP server
const server = http.createServer(app);

// Attach Socket.IO to the server
const io = new Server(server);

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Listen for a new message event
  socket.on('newMessage', async (data) => {
    try {
      // Save the message to the database
      await db.none(
        `INSERT INTO messages (chat_id, sender_id, content, created_at) 
         VALUES ($1, $2, $3, NOW())`,
        [data.chatId, data.senderId, data.content]
      );

      // Broadcast the message to all clients in the same chat room
      io.to(data.chatId).emit('messageReceived', data);
    } catch (error) {
      console.error('Error saving message:', error.message || error);
    }
  });

  // Join a chat room
  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat ${chatId}`);
  });

  // Leave a chat room
  socket.on('leaveChat', (chatId) => {
    socket.leave(chatId);
    console.log(`User ${socket.id} left chat ${chatId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Start the server
server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});