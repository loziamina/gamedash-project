import smtplib
from email.message import EmailMessage

from app.config import MAIL_FROM, MAIL_PASSWORD, MAIL_PORT, MAIL_SERVER, MAIL_USERNAME


def send_email(recipient: str, subject: str, body: str):
    if not MAIL_USERNAME or not MAIL_PASSWORD or not MAIL_FROM:
        raise RuntimeError("Mail configuration is missing")

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = MAIL_FROM
    message["To"] = recipient
    message.set_content(body)

    with smtplib.SMTP(MAIL_SERVER, MAIL_PORT) as server:
        server.starttls()
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        server.send_message(message)
