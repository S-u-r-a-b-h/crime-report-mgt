const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const port = 3000;

// MySQL Connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'crimedb'
});

connection.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Cookie parser middleware
app.use(cookieParser());

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads'); // Upload files to the 'uploads' directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Generate unique file name
  }
});
const upload = multer({ storage: storage });



// Home page route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});
app.post('/submit', (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const message = req.body.message;

  // Insert the form data into the database
  const sql = 'INSERT INTO feedback (name, email, message) VALUES (?, ?, ?)';
  connection.query(sql, [name, email, message], (err, result) => {
    if (err) {
      console.error('Error submitting feedback:', err.message);
      res.status(500).send('Error submitting feedback');
      return;
    }
    res.redirect('/');
  });
});

// User registration route
app.post("/user-register", (req, res) => {
  const { name, dob, gender, phone,pass } = req.body;
  const insertQuery = 'INSERT INTO user (name, dob, gender, phone, password) VALUES (?, ?, ?, ?, ?)';
  connection.query(insertQuery, [name, dob, gender, phone,pass], (err, result) => {
    if (err) {
      console.error("Error registering user:", err);
      return res.status(500).send("Error registering user. Please try again later.");
    }
    console.log("User registered successfully");
    res.redirect('/complaint_form.html');
  });
});


// Submit complaint route with file upload
app.post("/submit-complaint", upload.single('evidence'), (req, res) => {
  const { complaintType, name, description, location, dateTime } = req.body;
  const fileName = req.file ? req.file.filename : null; // Check if file exists
  const userLocation = req.cookies.user_location; // Retrieve user location from cookie

  // Insert complaint data into the database
  const insertQuery = 'INSERT INTO complaint (Crime_Type, Name, Description, Location, Date_Time, File_Name) VALUES (?, ?, ?, ?, ?, ?)';
  connection.query(insertQuery, [complaintType, name, description, location, dateTime, fileName], (err, result) => {
    if (err) {
      console.error("Error registering complaint:", err);
      return res.status(500).send("Error registering complaint. Please try again later.");
    }
    console.log("Complaint registered successfully");
    // Redirect or send response after the database operation is completed
    res.redirect('/'); // Redirect to home or another page
  });
});

app.post('/login', (req, res) => {
  const {uname,upass} = req.body;
  connection.query('SELECT * FROM user WHERE name = ? AND password= ?',
    [uname, upass],
    (error, results) => {
      if (error) {
        console.error('Error querying data:', error);
        return res.status(500).send('Error querying data from database');
      }
      // Check if any rows were returned
      if (results.length === 0) {
        return res.status(401).send('Invalid admin ID or password');
      }
      console.log('Logged in successfully');
     res.sendFile(path.join(__dirname, 'public', 'complaint_form.html'));
    
    
    });
});

// Police login route
app.post('/police_login', (req, res) => {
  const { username, batchNo, department, location } = req.body;
  res.cookie('user_location', location, { maxAge: 900000, httpOnly: true }); // Set a cookie with the location
  const selectQuery = 'SELECT * FROM police_login WHERE username = ? AND batchNo = ? AND department = ? AND location = ?';
  connection.query(selectQuery, [username, batchNo, department, location], (err, results) => {
      if (err) {
          console.error('Error selecting data:', err);
          res.status(500).send('Error selecting data from the database');
          return;
      }

      // If user exists and credentials match
      if (results.length > 0) {
          // Redirect to data display page
          res.redirect('/button.html');
      } else {
          // If user does not exist or credentials don't match
          res.status(401).send('Invalid credentials');
      }
  });
});

// Route to fetch complaints based on location
app.get('/complaints', (req, res) => {
  const location = req.cookies.user_location; // Retrieve location from the cookie
  console.log(location);

  // Query the database for complaints based on the location
  const selectQuery = 'SELECT * FROM complaint WHERE location = ?';
  connection.query(selectQuery, [location], (err, results) => {
      if (err) {
          console.error('Error selecting data:', err);
          res.status(500).send('Error selecting data from the database');
          return;
      }

      res.json(results); // Send the fetched complaints as JSON response
  });
});

app.get('/your-complaints', (req, res) => {
  const selectQuery = 'SELECT * FROM complaint';
  connection.query(selectQuery, (err, results) => {
    if (err) {
      console.error('Error selecting data:', err);
      res.status(500).send('Error selecting data from the database');
      return;
    }
    res.json(results); // Send the fetched complaints as JSON response
  });
});

// Endpoint to fetch complaint details by ID
app.get('/complaint/:id', (req, res) => {
  const complaint = req.params.id;
  const selectQuery = 'SELECT * FROM complaint WHERE complaintID = ?';
  connection.query(selectQuery, [complaint], (err, results) => {
    if (err) {
      console.error('Error selecting data:', err);
      res.status(500).send('Error selecting data from the database');
      return;
    }
    if (results.length > 0) {
      res.json(results[0]); // Send the fetched complaint details as JSON response
    } else {
      res.status(404).send('Complaint not found');
    }
  });
});



app.post('/delete-complaint', (req, res) => {
  const description = req.body.description;
  const deleteQuery = 'DELETE FROM complaint WHERE Description = ?';
  connection.query(deleteQuery, [description], (err, result) => {
      if (err) {
          console.error("Error deleting complaint:", err);
          return res.status(500).send("Error deleting complaint. Please try again later.");
      }
      if (result.affectedRows === 0) {
          console.log("No complaint deleted.");
          return res.status(404).send("No complaint deleted.");
      }
      console.log("Complaint deleted successfully");
      res.send("Complaint deleted successfully");
  });
});


app.post('/update', (req, res) => {
  const { cid, name, description, status,complaint_update, location } = req.body;
  const updateQuery = "UPDATE complaint SET Name = ?, Description = ?, Location = ? , status = ?, complaint_update=? WHERE complaintID = ?";

  connection.query(updateQuery, [name, description, location, status,complaint_update, cid], (err, result) => {
      if (err) {
          console.error("Error updating complaint:", err);
          return res.status(500).send("Error updating complaint. Please try again later.");
      }
      if (result.affectedRows === 0) {
          console.log("No complaint updated.");
          return res.status(404).send("No complaint updated.");
      }
      console.log("Complaint updated successfully");
      res.sendFile(path.join(__dirname, 'public', 'crimeReport.html'));
      res.redirect('/crimeReport.html');

  });
});

app.get('/feedback', (req, res) => {
  const sql = 'SELECT Name, Email, Message FROM feedback'; 
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching feedback data:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    res.json(results);
  });
});

app.post('/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  
  if (!name || !email || !message) {
      return res.status(400).send('Name, Email, and Message are required');
  }

  const query = 'INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)';
  connection.query(query, [name, email, subject, message], (err, result) => {
      if (err) throw err;
      
      res.redirect('/');
  });
});



// Start server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
