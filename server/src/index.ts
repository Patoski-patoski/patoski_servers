// server/src/index.ts

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import nodemailer from 'nodemailer'

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

const allowedOrigins = [
    'https://patrick-patoski.vercel.app',
<<<<<<< HEAD
    process.env.LOCALHOST,
=======
    'http://localhost:5173',
>>>>>>> 9196c76cd5c06213be40d50b11c6f32f4650be36
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));


app.post('/api/contact', async (req, res) => { 
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
	   return res.status(400).json({
	   success: false,
           message: "Invalid email format"});
	}

        // CReate an email transporter
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            },
        });

        const mailOption = {
            // FROM: The system email that's sendingg the message
            from: `"Portfolio Contact Form" <${process.env.EMAIL_USER}>`,

            // TO: YOUR email where you want to receive messages
            to: process.env.RECIPIENT_EMAIL || 'codesbypatrick@gmail.com',

            // REPLY-TO: The visitor's email
            replyTo: email,

            subject: `Portfolio Contact: ${subject}`,
            text: `
                Name: ${name}
                Email: ${email}
        
                Message:
                ${message}
                `,
            html: `
                <h3>New contact from your portfolio</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <h4>Message:</h4>
                <p>${message}</p>
            `,
        };

        // Send the email
        await transporter.sendMail(mailOption);

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error sending mail", error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'An unknown error occurred'
        });
    }
});

// Health check endpoint
app.get(['/', 'health'], (_, res) => {
    res.status(200).json({
        msg: "Hello Docker",
        status: 'ok'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
