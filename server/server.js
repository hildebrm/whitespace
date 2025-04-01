const express = require("express");
const mongoose = require("mongoose");
const Document = require("./Document");
const cors = require("cors");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://localhost/white-space", {
})
  .then(() => console.log("MongoDB connected"))
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

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const defaultData = "";

io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("get-document", async (documentId) => {
        if (!documentId) return socket.emit("error", "Invalid document ID");

        try {
            const document = await findOrCreateDocument(documentId);
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

async function findOrCreateDocument(id) {
    if (!id) throw new Error("Invalid document ID");

    let document = await Document.findById(id);
    if (document) return document;

    return await Document.create({ _id: id, data: defaultData });
}

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