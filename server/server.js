require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');
const passport = require('passport'); // Add passport import
const Document = require("./models/Document");

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize passport before requiring route files
app.use(passport.initialize());
require('./config/passport')(passport);

// Apply middleware before routes
app.use(express.json());
app.use(cors({
    origin: [
      process.env.CLIENT_ORIGIN || "http://localhost:3000",
      process.env.RENDER_URL,
      /https:\/\/.*\.vercel\.app$/
    ],
    methods: ["GET", "POST", "DELETE", "PUT"],
}));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const RENDER_URL = process.env.RENDER_URL || "http://localhost:3001";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/white-space";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected!"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.get('/api/documents', async (req, res) => {
    try {
        const documents = await Document.find().sort({ createdAt: -1 });
        res.json(documents);
    } catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.post('/api/predict', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: 'Text is required' });
        }
        
        if (!OPENAI_API_KEY) {
            return res.status(500).json({ error: 'OpenAI API key not configured' });
        }
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: "system", content: "You are an autocomplete assistant. Continue the user's text with a short, relevant suggestion." },
                    { role: "user", content: text }
                ],
                max_tokens: 20,
                temperature: 0.7,
                stop: ['\n'],
                n: 1
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to get prediction');
        }
        
        const data = await response.json();
        const prediction = data.choices[0].message.content.trim() || '';
        
        return res.json({ prediction });
    } catch (error) {
        console.error('Prediction error:', error.message);
        return res.status(500).json({ error: 'Failed to generate prediction' });
    }
});

app.delete('/api/documents/:id', async (req, res) => {
    try {
        const documentId = req.params.id;
        const deletedDocument = await Document.findByIdAndDelete(documentId);
        if (!deletedDocument) {
            return res.status(404).json({ message: "Document not found" });
        }

        res.json({ message: "Document deleted successfully" });
    } catch (error) {
        console.error("Error deleting document:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.put('/api/documents/:id/title', async (req, res) => {
    try {
        const { title } = req.body;

        const updatedDocument = await Document.findByIdAndUpdate(
            req.params.id,
            { title: title || "Untitled Document" }, // Defaults to "Untitled Document" if no title is provided
            { new: true }
        );

        res.json(updatedDocument);
    } catch (error) {
        console.error("Error updating document title:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const io = require('socket.io')(server, {
    cors: {
      origin: CLIENT_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

const defaultData = "";

io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("get-document", async (documentId, userId) => {
        if (!documentId) return socket.emit("error", "Invalid document ID");

        try {
            const document = await findOrCreateDocument(documentId, userId);
            socket.join(documentId);
            socket.emit("load-document", document.data);
        } catch (err) {
            console.error("Error retrieving document:", err);
            return socket.emit("error", "Error retrieving document");
        }

        socket.on("send-changes", (delta) => {
            socket.broadcast.to(documentId).emit("receive-changes", delta);
        });

        socket.on("save-document", async (data) => {
            try {
                await Document.findByIdAndUpdate(documentId, { data });
            } catch (err) {
                console.error("Error saving document:", err);
            }
        });
    });
});

async function findOrCreateDocument(id, userId = null) {
    if (!id) throw new Error("Invalid document ID");

    let document = await Document.findById(id);
    if (document) {
        // If the document exists but doesn't have a userId, update it
        if (userId && !document.userId) {
            document.userId = userId;
            await document.save();
        }
        return document;
    }

    // Create a new document with userId if provided
    return await Document.create({ 
        _id: id, 
        data: defaultData,
        userId: userId || null
    });
}