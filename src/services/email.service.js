import nodemailer from 'nodemailer';
import config from '../config/config.js';


const transporter = nodemailer.createTransport({
    // Explicit SMTP settings make behavior more consistent on hosted platforms.
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE
        ? process.env.SMTP_SECURE === 'true'
        : true,
    auth: {
        type: 'OAuth2',
        user: config.GOOGLE_USER,
        clientId: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        refreshToken: config.GOOGLE_REFRESH_TOKEN
    },
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT || 20000),
});


// Avoid blocking app startup on SMTP connectivity.
// Enable manually when you need to test SMTP: set `SMTP_VERIFY=true` on Render.
if (process.env.SMTP_VERIFY === 'true') {
    transporter.verify((error) => {
        if (error) console.error('SMTP verify failed:', error);
        else console.log('SMTP server is ready to send messages');
    });
}

export const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"Your Name" <${config.GOOGLE_USER}>`, // sender address
            to, // list of receivers
            subject, // Subject line
            text, // plain text body
            html, // html body
        });

        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

