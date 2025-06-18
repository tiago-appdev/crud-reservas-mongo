import nodemailer from 'nodemailer';
import dayjs from 'dayjs';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Send confirmation email to the user
 * @param {Object} user - User data (contains email)
 * @param {Object} reservation - Reservation details
 */
export const sendReservationEmail = async (user, reservation) => {
  if (!reservation.table_id || !reservation.table_id.table_number) {
    throw new Error('Table details not available for the reservation.');
  }
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  const formattedDate = dayjs(reservation.date).format('MMMM D, YYYY h:mm A');

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Confirmación de reserva',
    html: `
        <h3>Hola ${user.name},</h3>
        <p>¡Gracias por elegir nuestro restaurante! Su reserva ha sido confirmada.</p>
        <p><strong>Detalles de la Reserva:</strong></p>
        <ul>
          <li><strong>Número de mesa:</strong> ${reservation.table_id.table_number}</li>
          <li><strong>Fecha y Hora:</strong> ${formattedDate}</li>
          <li><strong>Comensales:</strong> ${reservation.guests}</li>
        </ul>
        <p>Esperamos verte pronto. Si necesitas hacer algún cambio en tu reserva, no dudes en ponerte en contacto con nosotros.</p>
        <p>Saludos cordiales,</p>
        <p><strong>El equipo de [Nombre del Restaurante]</strong></p>
      `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
  