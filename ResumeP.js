const express = require('express');
const multer = require('multer');
const { MongoClient } = require('mongodb');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/profile', upload.fields([{ name: 'picture', maxCount: 1 }, { name: 'resume', maxCount: 1 }]), async (req, res) => {
  const { name, email } = req.body;
  const picture = req.files['picture'][0];
  const resume = req.files['resume'][0];

  const client = new MongoClient(uri, { useUnifiedTopology: true });
  try {
    await client.connect();
    const database = client.db('example');
    const collection = database.collection('profiles');

    const result = await collection.insertOne({
      name,
      email,
      profilePicture: picture.path,
      resume: resume.path,
    });

    res.send(`Profile for ${name} created with ID ${result.insertedId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred');
  } finally {
    await client.close();
  }
});
