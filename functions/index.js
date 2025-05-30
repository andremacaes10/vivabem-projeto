const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Configura o Gmail (ou outro serviço SMTP)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "teuemail@gmail.com",
    pass: "tuasenhaouAppPassword"
  }
});

// Destinatário (pode ser o teu email pessoal/profissional)
const DESTINATARIO = "andremacaes12@gmail.com";

// Função que escuta novas mensagens
exports.enviarEmailContacto = functions.firestore
  .document("mensagensContacto/{docId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    
    const mailOptions = {
      from: `"Contacto do Site" <teuemail@gmail.com>`,
      to: DESTINATARIO,
      subject: `Nova mensagem de ${data.nome}`,
      text: `Nome: ${data.nome}\nEmail: ${data.email}\n\nMensagem:\n${data.mensagem}`
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("Email enviado com sucesso");
    } catch (error) {
      console.error("Erro ao enviar email:", error);
    }
  });