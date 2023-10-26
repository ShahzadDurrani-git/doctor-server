// server.js

const express = require('express');
const bodyParser = require('body-parser');
const { FieldValue } = require('firebase-admin/firestore')
const { db } = require('./firebase.js')
const cors = require("cors");
const nodemailer = require('nodemailer');
require('dotenv').config();


const app = express();
app.use(cors());
const port = process.env.PORT || 9000;
const user = process.env.MAIL_USER;
const pass = process.env.MAIL_PASS;
const service = process.env.MAIL_HOST;
const client = process.env.CLIENT_ID;
const secretKey = process.env.SECRET_KEY;
const refreshToken  = process.env.REFRESH_TOKEN;

app.use(bodyParser.json());


const groups = db.collection("Groups");
const emailHistory = db.collection("History");

// Create a transporter using nodemailer
const transporter = nodemailer.createTransport({
  service: service,
  auth: {
    type: 'OAuth2',
    user: user,
    pass: pass,
    clientId: client,
    clientSecret: secretKey,
    refreshToken: refreshToken
  }
});

// API endpoints

// Get doctors for a specific group
app.get('/groups/:groupId/doctors', async (req, res) => {
  try {
    const groupId = req.params.groupId;
    
    // Assuming "groups" is a reference to the Firebase collection "Groups"
    const groupRef = groups.doc(groupId);
    const doctorsCollection = groupRef.collection('doctors');

    const doctorsSnapshot = await doctorsCollection.get();
    // Check if there are no doctors
    if (doctorsSnapshot.empty) {
      res.status(404).json({ message: 'No doctors found for the group' });
      return;
    }
    const groupDoctors = [];
    doctorsSnapshot.forEach((doc) => {
      groupDoctors.push({
        id: doc.id,
        data: doc.data()
      });
    });

    res.status(200).json(groupDoctors);
  } catch (error) {
    console.error('Error getting doctors for the group:', error);
    res.status(500).json({ error: 'Error getting doctors for the group' });
  }
});


// Add a doctor to a group
app.post('/groups/:groupId/doctors', async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const doctorData = req.body;

    // Assuming "groups" is a reference to the Firebase collection "Groups"
    const groupRef = groups.doc(groupId);
    const doctorsCollection = groupRef.collection('doctors');

    const doctorDocRef = await doctorsCollection.add({ doctorDetails: doctorData });

    res.status(201).json({ message: 'Doctor added to the group successfully', doctorId: doctorDocRef.id });
  } catch (error) {
    console.error('Error adding doctor to the group:', error);
    res.status(500).json({ error: 'Error adding doctor to the group' });
  }
});


// Get all groups
app.get('/groups', async (req, res) => {
  try {
    const groupsSnapshot = await groups.get();
    const allGroups = [];
    groupsSnapshot.forEach((doc) => {
      allGroups.push({
        id: doc.id,
        data: doc.data()
      });
    });
    res.status(200).json(allGroups);
  } catch (error) {
    console.error('Error getting groups:', error);
    res.status(500).json({ error: 'Error getting groups' });
  }
});

// Get a group by ID
app.get('/groups/:groupId', async (req, res) => {
  const { groupId } = req.params;

  try {
    const groupDoc = await groups.doc(groupId).get();

    if (!groupDoc.exists) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    const groupData = groupDoc.data();
    res.status(200).json({
      id: groupDoc.id,
      data: groupData
    });
  } catch (error) {
    console.error(`Error getting group with ID ${groupId}:`, error);
    res.status(500).json({ error: 'Error getting group' });
  }
});


// Update a doctor
app.put('/doctors/:currGroup/:doctorId', async (req, res) => {
  try {
    const currGroup = req.params.currGroup;
    const doctorId = req.params.doctorId;
    const updatedDoctorData = req.body;

    const groupRef = groups.doc(currGroup);
    const doctorsCollection = groupRef.collection('doctors');
    const doctorRef = doctorsCollection.doc(doctorId); // Get the Document Reference
    const doctorDoc = await doctorRef.get();
    if (!doctorDoc.exists) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    await doctorRef.update({ doctorDetails: updatedDoctorData });

    res.status(200).json({ message: 'Doctor updated successfully' });
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({ error: 'Error updating doctor' });
  }
});

// Delete a doctor
app.delete('/doctors/:currGroup/:doctorId', async (req, res) => {
  try {
    const currGroup = req.params.currGroup;
    const doctorId = req.params.doctorId;

    const groupRef = groups.doc(currGroup);
    const doctorsCollection = groupRef.collection('doctors');
    const doctorRef = doctorsCollection.doc(doctorId); // Get the Document Reference
    const doctorDoc = await doctorRef.get();
    if (!doctorDoc.exists) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    await doctorRef.delete();

    res.status(200).json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ error: 'Error deleting doctor' });
  }
});

app.get('/doctors', async (req, res) => {
  try {
    const doctorId = req.query.doctorId;
    const groupId = req.query.groupId;

    // Assuming "doctors" is a reference to the Firebase collection "Doctors"
    const groupRef = groups.doc(groupId);
    const doctorsCollection = groupRef.collection('doctors');

    const doctorDoc = await doctorsCollection.doc(doctorId).get();

    if (!doctorDoc.exists) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const doctorData = doctorDoc.data();
    res.status(200).json({ doctor: doctorData });
  } catch (error) {
    console.error('Error getting doctor:', error);
    res.status(500).json({ error: 'Error getting doctor' });
  }
});



// Create a new group
app.post('/groups', async (req, res) => {
  try {
    const newGroupData = req.body;
    const groupRef = await groups.add({ groupDetails: newGroupData });
    res.status(201).json({ message: 'Group created successfully', groupId: groupRef.id });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Error creating group' });
  }
});

// Update a group
app.put('/groups/:groupId', async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const updatedGroupData = req.body;

    // Assuming "groups" is a reference to the Firebase collection "Groups"
    const groupRef = groups.doc(groupId);
    await groupRef.update({ groupDetails: updatedGroupData });

    res.status(200).json({ message: 'Group updated successfully' });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: 'Error updating group' });
  }
});

// Delete a group
app.delete('/groups/:groupId', async (req, res) => {
  try {
    const groupId = req.params.groupId;

    // Assuming "groups" is a reference to the Firebase collection "Groups"
    const groupRef = groups.doc(groupId);
    await groupRef.delete();

    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Error deleting group' });
  }
});

// Send an email to all doctors in a group and store email metadata
app.post('/groups/:groupId/send-email', async (req, res) => {
  try {
    const groupId = req.params.groupId;

    // Fetch the group
    const groupRef = groups.doc(groupId);
    const groupSnapshot = await groupRef.get();

    
    if (!groupSnapshot.exists) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Fetch the doctors in the group
    const doctorsCollection = groupRef.collection('doctors');
    const doctorsSnapshot = await doctorsCollection.get();
    

    if (doctorsSnapshot.empty) {
      return res.status(400).json({ error: 'No doctors found in the group' });
    }

    // Get recipient emails
    const recipientEmails = doctorsSnapshot.docs
      .map(doc => doc.data().doctorDetails.email)
      .filter(email => email);

    // Send the email (replace with your email sending logic)
    const mailOptions = {
      from: 'Shahzaddurrani00@gmail.com',
      to: recipientEmails.join(', '),
      subject: req.body.subject,
      text: req.body.message
    };

    await transporter.sendMail(mailOptions, function(err, data) {
      if (err) {
        console.log("Error " + err);
      } else {
        console.log("Email sent successfully");
      }
    });

    // Store email metadata
    await emailHistory.add({
      groupId: groupId,
      status: 'success',
      timestamp: FieldValue.serverTimestamp()
    });

    res.status(200).json({ message: 'Email sent successfully to all doctors in the group' });
  } catch (error) {
    // await emailHistory.add({
    //   groupId: groupId,
    //   status: 'failed',
    //   timestamp: FieldValue.serverTimestamp()
    // });
    console.error('Error sending email to doctors:', error);
    res.status(500).json({ error: 'Error sending email to doctors' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
