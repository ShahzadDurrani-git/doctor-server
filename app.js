const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();
const port = 9001;
const axios = require("axios");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const path = require("path");
const http = require("http");
var ip = require('ip');
const os = require('os');
const fs = require("fs");
const xlsx = require('xlsx');
const uploadsPath = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsPath));
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
server.listen(port, () => {
  const hostname = os.hostname();
  console.log("Your IP address is " + ip.address());
  console.log(`Server is running on https://localhost:${port}`);
});
const uri = "mongodb+srv://yahyaammar:wkBM0FIbJDZSb9Hl@cluster0.skkmm1v.mongodb.net/?retryWrites=true&w=majority"
const client = new MongoClient(uri, {
  serverApi: {
    version: "1",
    strict: true,
  },
});
async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas!");
    return client.db("salesautomationdb");
  } catch (error) {
    console.error("Error connecting to MongoDB Atlas: hehe", error);
    throw error;
  }
}

async function closeTheDB() {
  try {
    await client.close();
    console.log("Closed Connection");
    return 
  } catch (error) {
    console.error("Error connecting to MongoDB Atlas:", error);
    throw error;
  }
}


app.post("/api/create-group", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("group");

    const { name, phoneNumbers } = req.body;

    const currentTimestamp = new Date().toISOString();


    // Create a new group document
    const newGroup = {
      name: name,
      phoneNumbers: phoneNumbers,
      createdAt: currentTimestamp,
    };

    // Insert the new group document into the "group" collection
    const result = await collection.insertOne(newGroup);

    console.log("New group document inserted:", result.insertedId);

    return res.status(201).json({
      success: true,
      message: "New group created successfully!",
    });
  } catch (error) {
    console.error("Error creating new group:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create new group",
    });
  } finally {
    // Close the MongoDB connection
    await closeTheDB();
  }
});

app.get("/api/group/:id", async (req, res) => {
  try {
    const groupId = req.params.id; // Get the group ID from the URL parameters
    // await client.connect();
    const db = await connectToDatabase();
    // db = client.db("salesautomationdb");
    const collection = db.collection("group");
    // Find the group by its ID
    const group = await collection.findOne({ _id: new ObjectId(groupId) });
    if (!group) {
      // If no group found with the given ID, return a 404 response
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }
    // If the group is found, return it as a response
    return res.status(200).json({
      success: true,
      group: group,
    });
  } catch (error) {
    console.error("Error finding group:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to find group",
    });
  } finally {
    // Close the MongoDB connection
    await closeTheDB();
  }
});

app.put("/api/groups/:id", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("group");

    const { name, phoneNumbers } = req.body;
    const groupId = req.params.id; // Extract the group ID from the request parameters

    // Validate the provided group ID
    if (!ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID format.",
      });
    }

    // Update the group document based on the provided data
    const updatedGroup = {
      name: name,
      phoneNumbers: phoneNumbers,
    };

    // Find the group document by its ID and update it
    const result = await collection.updateOne(
      { _id: new ObjectId(groupId) }, // Create a new instance of ObjectId
      { $set: updatedGroup }
    );

    if (result.matchedCount === 0) {
      // No matching group found
      return res.status(404).json({
        success: false,
        message: "Group not found.",
      });
    }

    console.log("Group updated successfully!");

    return res.status(200).json({
      success: true,
      message: "Group updated successfully!",
    });
  } catch (error) {
    console.error("Error updating group:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update group.",
    });
  } finally {
    // Close the MongoDB connection
    await closeTheDB();
  }
});

app.get("/api/groups", async (req, res) => {
  try {
    // await client.connect();
    // db = client.db("salesautomationdb");
    const db = await connectToDatabase();
    const collection = db.collection("group");

   
    // Find all group documents in the collection
    const groups = await collection.find({}).toArray();

    console.log("Fetched all groups:", groups);

    // Calculate total phone numbers, total answered, and total duration for each group
    const groupsWithTotals = groups.map((group) => {
      let totalPhoneNumbers = 0;
      let totalAnswered = 0;
      let totalDuration = 0;
      let formattedDuration;

      group.phoneNumbers.forEach((phoneNumber) => {
        totalPhoneNumbers++;
        if (phoneNumber.answered === "yes") {
          totalAnswered++;
          if (phoneNumber.duration) {
            // Assuming duration is in seconds, you can convert it to minutes or hours if needed
            totalDuration += parseInt(phoneNumber.duration);
          
          }
        }
      });
      

      if (totalDuration < 60) {
        // If the duration is less than 60 seconds, display it as seconds
        formattedDuration = `${totalDuration} sec`;
      } else {
        // If the duration is 60 seconds or more, convert it to minutes
        const durationInMinutes = durationInSeconds / 60;
        formattedDuration = `${durationInMinutes} min`;
      }


      return {
        ...group,
        totalPhoneNumbers: totalPhoneNumbers,
        totalAnswered: totalAnswered,
        totalDuration: formattedDuration,
        createdAt: group.createdAt,
      };
    });



    return res.status(200).json({
      success: true,
      groups: groupsWithTotals,
    });
  } catch (error) {
    console.error("Error fetching groups:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch groups.",
    });
  } finally {
    // Close the MongoDB connection
    await closeTheDB();
  }
});

app.post(
  "/api/upload-audio",
  upload.single("sales_automation_messages"),
  async (req, res) => {
    try {
      const uploadedFile = req.file;
      const index = req.body.index
      console.log("hello world");

      if (!uploadedFile) {
        return res.status(400).json({
          success: false,
          message: "No audio file uploaded.",
        });
      }

      const db = await connectToDatabase();
      const collection = db.collection("sales_automation_messages");

      // Save the uploaded file to the collection (you can adjust the storage mechanism as needed)
      // For example, you can use GridFS to store large audio files in Mon````goDB
      const result = await collection.insertOne({ audio: uploadedFile });


      // Create the link for the uploaded audio file
      const audioLink = `http://16.163.178.109:9000/uploads/${uploadedFile.filename}`;


      var filename

      if(index == '0'){
        filename= 'welcome'
      }else if(index == '1'){
        filename= 'sales-pitch'
      }else if(index == '2'){
        filename= 'yes'
      }else if(index == '5'){
        filename= 'yes'
      }else if(index == '7'){
        filename= 'hearme'
      }else{
        fliename = 'message'
      }



      // Make a POST request to the specified URL with the audio link as a query parameter
      const url = `http://16.163.178.109/aivoip/speech/save-audio-file.php?url=${encodeURIComponent(
        audioLink
      )}&message=${filename}&message_text=${filename}`

      const response =  axios.get(url);



      return res.status(200).json({
        success: true,
        message: "Audio file uploaded and posted successfully!",
      });
    } catch (error) {
      console.error("Error uploading audio file:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to upload audio file.",
      });
    } finally {
      // Close the MongoDB connection
      await closeTheDB();
    }
  }
);

app.post("/api/messages",
  upload.single("audio_file"),
  async (req, res) => {
    try {
      const uploadedFile = req.file.filename;

      const db = await connectToDatabase();
      const collection = db.collection("messages");

      const request = req.body
      const message = {
        ...request,
        uploadedFile
      }


      // Insert the array of messages into the "sales_automation_messages" collection
      const result = await collection.insertOne(message);

      console.log(`${result.insertedCount} messages inserted successfully!`);

      return res.status(201).json({
        success: true,
        message: "Messages inserted successfully!",
        insertedCount: result,
      });
    } catch (error) {
      console.error("Error inserting messages:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to insert messages.",
      });
    } finally {
      // Close the MongoDB connection
      await closeTheDB();
    }
  });

app.get("/api/messages", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("messages");

    // Find all documents in the "sales_automation_messages" collection
    const messages = await collection.find({}).toArray();

    return res.status(200).json({
      success: true,
      messages: messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages.",
    });
  } finally {
    // Close the MongoDB connection
    await closeTheDB();
  }
});

app.put("/api/messages/:id", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("sales_automation_messages");

    const messageId = req.params.id; // Extract the message ID from the request parameters

    // Validate the provided message ID
    if (!ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID format.",
      });
    }

    const { id, parent_id, keyword, audio_file, text } = req.body;

    // Update the message document based on the provided data
    const updatedMessage = {
      id: id,
      parent_id: parent_id,
      keyword: keyword,
      audio_file: audio_file,
      text: text
    };

    // Find the message document by its ID and update it
    const result = await collection.updateOne(
      { _id: new ObjectId(messageId) }, // Create a new instance of ObjectId
      { $set: updatedMessage }
    );

    if (result.matchedCount === 0) {
      // No matching message found
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    console.log("Message updated successfully!");

    return res.status(200).json({
      success: true,
      message: "Message updated successfully!",
    });
  } catch (error) {
    console.error("Error updating message:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update message.",
    });
  } finally {
    // Close the MongoDB connection
    await closeTheDB();
  }
});

app.post("/api/add-phone-number", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("group");

    // const { groupId, phoneNumber } = req.body;
    const { groupId, phoneNumber, status, duration, keyword, answered } = req.body;

    // Check if groupId is a valid ObjectId
    if (!ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID format",
      });
    }

    // Find the group by its ObjectId
    const existingGroup = await collection.findOne({
      _id: new ObjectId(groupId),
    });

    if (!existingGroup) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Set the current timestamp as the createdAt value
    const currentTimestamp = new Date().toISOString();

    // Append the new phone number object to the group with additional fields
    const newPhoneNumber = {
      number: phoneNumber,
      status: status,
      createdAt: currentTimestamp, // Set the createdAt value here
      duration: duration,
      keyword: keyword,
      answered: answered,
    };

    // Append the new phone number to the group
    // existingGroup.phoneNumbers.push({ number: phoneNumber });
    existingGroup.phoneNumbers.push(newPhoneNumber);

    // Update the group document in the "group" collection
    const result = await collection.updateOne(
      { _id: new ObjectId(groupId) }, // Use 'new ObjectId()' here
      { $set: { phoneNumbers: existingGroup.phoneNumbers } }
    );

    console.log("Phone number added to group:", groupId);

    return res.status(200).json({
      success: true,
      message: "Phone number added to group successfully!",
    });
  } catch (error) {
    console.error("Error adding phone number to group:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add phone number to group",
    });
  } finally {
    // Close the MongoDB connection
    await closeTheDB();
  }
});

app.put("/api/update-phone-number", async (req, res) => {
  try {
    const { phoneNumber, chat, callDuration } = req.body;

    const db = await connectToDatabase();
    const collection = db.collection("group");

    // Find the phone number in the database based on the provided phoneNumber
    const group = await collection.findOne({
      "phoneNumbers.number": phoneNumber,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Phone number not found in the database.",
      });
    }

    // Update the chat and callDuration for the specific phone number
    const updatedPhoneNumbers = group.phoneNumbers.map((phone) => {
      if (phone.number === phoneNumber) {
        return {
          ...phone,
          chat: chat,
          callLength: callDuration,
        };
      }
      return phone;
    });

    // Update the entire group document with the updated phoneNumbers array
    const result = await collection.updateOne(
      { _id: new ObjectId(group._id) },
      { $set: { phoneNumbers: updatedPhoneNumbers } }
    );

    console.log("Phone number updated successfully!");

    return res.status(200).json({
      success: true,
      message: "Phone number updated successfully!",
    });
  } catch (error) {
    console.error("Error updating phone number:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update phone number.",
    });
  } finally {
    // Close the MongoDB connection
    await closeTheDB();
  }
});



app.post("/api/edit-text-message", async (req, res) => {
  try {
    const { currentMessage, currentPara, index, id } = req.body;
    const db = await connectToDatabase();
    const collection = db.collection("messages");
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          primary: currentMessage,
          secondary: currentPara,
        },
      }
    );



    if (result.modifiedCount === 1) {
      return res.status(200).json({
        success: true,
        message: "Message updated successfully!",
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Message not found or not updated.",
      });
    }
  } catch (error) {
    console.error("Error updating phone number:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update phone number.",
    });
  } finally {
    // Close the MongoDB connection
    await closeTheDB();
  }
});



app.post(
  "/api/upload-excel",
  upload.single("excel_file"),
  async (req, res) => {
    try {
      const uploadedFile = req.file;
      const groupId = req.body.id
      const db = await connectToDatabase();


      if (!uploadedFile) {
        return res.status(400).json({
          success: false,
          message: "No Excel file uploaded.",
        });
      }

      // read file content here 
      console.log('Reading File Contents')
      const workbook = xlsx.readFile(uploadedFile.path);

      // Assuming there's only one sheet in the Excel file, you can access it like this:
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Parse the sheet data to JSON
      const jsonData = xlsx.utils.sheet_to_json(sheet);

      if (validateData(jsonData)) {
        // inserting records in db
        console.log('inserting records in db')

        // Validate the provided group ID
        if (!ObjectId.isValid(groupId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid group ID format.",
          });
        }


        const keys = Object.values(jsonData);
        const numbers = keys?.map((item) => {
          return item[Object.keys(jsonData[0])[0]]
        })

        const currentTimestamp = new Date();

        const updatedPhoneNumbers = numbers.map(phoneNumber => {
          const strNum = phoneNumber.toString();
          return {
            number: strNum,
            status: 'idle', // Assuming you have status defined somewhere
            createdAt: currentTimestamp,
            duration: 0, // Assuming you have duration defined somewhere
            keyword: '', // Assuming you have keyword defined somewhere
            answered: '', // Assuming you have answered defined somewhere
          };
        });

        const updatedGroup = {
          phoneNumbers: updatedPhoneNumbers,
        };

        // Update the group document based on the provided data
        // const updatedGroup = {
        //   phoneNumbers: numbers,
        // };
        const collection = db.collection("group");

        // Find the group document by its ID and update it
        const result = await collection.updateOne(
          { _id: new ObjectId(groupId) }, // Create a new instance of ObjectId
          // { $set: updatedGroup }
          { $push: { phoneNumbers: { $each: updatedPhoneNumbers } } }
        );

        return res.status(200).json({
          success: true,
          message: "Data uploaded successfully",
        });

      } else {
        console.error("Error uploading excel file:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to upload excel file.",
        });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to upload excel file.",
      });
    } finally {
      // Close the MongoDB connection
      await closeTheDB();
    }
  }
);

app.post(
  "/api/insert-message",
  upload.single("audioFile"),
  async (req, res) => {
    try {
      const uploadedFile = req.file;
      const textMessage = req.body.textMessage; // Use req.body.textMessage to access the text message

      const db = await connectToDatabase();
      const collection = db.collection("messages");
      const newMessage = {
        textMessage: textMessage,
        audioFile: uploadedFile.filename, // Assuming you store the filename of the uploaded audio file
      };

      const response = await collection.insertOne(newMessage);

      return res.status(200).json({
        success: true,
        message: `Response is: ${response.insertedId}`, // Send a plain string message
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to upload audio file.",
      });
    } finally {
      // Close the MongoDB connection
      await closeTheDB();
    }
  }
);



function validateData(data) {
  for (const item of data) {
    const keys = Object.keys(item);

    // Check if there is more than one key in the object or if the value is not a number
    if (keys.length !== 1 || typeof item[keys[0]] !== 'number') {
      return false; // Data format is not as expected
    }
  }
  return true; // Data format is as expected
}


// app.post("/api/create-logs", async (req, res) => {
//   try {

//     const { number, start_time, end_time, text, user, seq, date, call_status } = req.body;
//     const db = await connectToDatabase();
//     const collection = db.collection("logs");
//     const result = await collection.insertOne(
//      {number, start_time, end_time, text, user, seq, date, call_status}
//     );
//   } catch (error) {
//     console.error("Error in creating logs:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to create logs.",
//     });
//   }
// });

app.post("/api/create-logs", async (req, res) => {
  try {
    const { number, start_time, end_time, text, user, seq, date, call_status } = req.body;
    const db = await connectToDatabase();
    const logsCollection = db.collection("logs");
    const groupsCollection = db.collection("group");

    // Check if the provided number exists in any group
    console.log("Searching for number:", number);

    const groupWithNumber = await groupsCollection.findOne({
      "phoneNumbers.number": number,
    });
    console.log("Group with Number:", groupWithNumber);

    if (groupWithNumber) {
      // If the number is found in a group, save the log along with the group information
      const result = await logsCollection.insertOne({
        number,
        start_time,
        end_time,
        text,
        user,
        seq,
        date,
        call_status,
        groupId: groupWithNumber._id, // Store the group ID with the log
      });

      return res.status(200).json({
        success: true,
        message: "Log created successfully!",
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Number not found in any group.",
      });
    }
  } catch (error) {
    console.error("Error in creating logs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create logs.",
    });
  } finally {
    // Close the MongoDB connection
    await closeTheDB();
  }
});


app.post("/api/get-chat-text", async (req, res) => {
  try {
    const { number, groupId } = req.body;
    const db = await connectToDatabase();
    const logsCollection = db.collection("logs");
    const groupIdObjectId = new ObjectId(groupId);
    // Find all logs with the provided number and group ID
    const chatLogs = await logsCollection.find({ number, groupId: groupIdObjectId }).toArray();

    // Extract the text from each chat log
    const chatText = chatLogs.map((log) => log);
    return res.status(200).json({
      success: true,
      chatText,
    });
  } catch (error) {
    console.error("Error in retrieving chat text:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve chat text.",
    });
  } finally {
    // Close the MongoDB connection
    await closeTheDB();
  }
});



app.get('/api/getSipSetting', async (req, res) => {

  axios.get('http://16.163.178.109/aivoip/sip/fetch-sip.php')
    .then((response) => {
      return res.status(200).json({
        status: 'success',
        data: response.data
      });
    })
    .catch((err) => {
      return res.status(400).json({
        status: 'Failed',
        data: err.message
      })
    })
})




app.post('/api/updateSetting', async (req, res) => {

  const data = req.body

  axios.post('http://16.163.178.109:9001/api/update-setting', data)
    .then((response) => {
      return res.status(200).json({
        status: 'success',
        data: response.data
      });
    })
    .catch((err) => {
      return res.status(400).json({
        status: 'Failed',
        data: err.message
      })
    })
})








app.post('/api/call-numbers', async (req, res) => {

  const data = req.body

  axios.post('http://16.163.178.109/aivoip/autodial/dial_numbers_1.php', data)
  
  return res.status(200).json({
    status: 'success',
    data: "Calls has been Started"
  });


})

app.get('/api/stop-calling', async (req, res) => {


  axios.get('http://16.163.178.109/aivoip/autodial/stop_dials.php')
  
  return res.status(200).json({
    status: 'success',
    data: "Calls has been Ended"
  });


})

app.post('/api/concurrent-number', async (req, res) => {
  try {
    const data = req.body
    const db = await connectToDatabase();
    const con = db.collection("con");
    console.log(data)
    // delete pervious concurrent number
    const result = await con.deleteMany({});

    const result2 = await con.insertOne(data);

    return res.status(200).json({
      success: true,
      result2,
    });
  } catch (error) {
    console.error("Error in retrieving chat text:", error);
    return res.status(500).json({
      success: false,
      message: error,
    });
  } finally {
    // Close the MongoDB connection
    await closeTheDB();
  }
})



app.get('/api/concurrent-number', async (req, res) => {
  try {

    const db = await connectToDatabase();
    // db = client.db("salesautomationdb");
    const con = db.collection("con");

    // Retrieve the concurrent number (assuming you have only one)
    const concurrentNumber = await con.findOne();


    return res.status(200).json({
      success: true,
      concurrentNumber,
    });
  } catch (error) {
    console.error("Error in retrieving concurrent number:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve concurrent number.",
    });
  } finally {
    // Close the MongoDB connection
    await closeTheDB();
  }
});