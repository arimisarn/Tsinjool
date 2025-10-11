import os
import django
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
import random
import string

# Initialiser Django
os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE", "coaching_backend.settings"
)  # adapte le nom
django.setup()


def generate_confirmation_code(length=6):
    """Génère un code de confirmation aléatoire."""
    return "".join(random.choices(string.digits, k=length))


def send_test_email():
    code = generate_confirmation_code()
    email = input("Entre ton email de test : ").strip()

    subject = "Test SendGrid via Anymail - Tsinjool"
    from_email = settings.DEFAULT_FROM_EMAIL
    to = [email]

    context = {"confirmation_code": code, "site_name": "Tsinjool"}
    html_content = render_to_string("emails/confirmation_email.html", context)
    text_content = f"Ton code de confirmation : {code}"

    try:
        msg = EmailMultiAlternatives(subject, text_content, from_email, to)
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        print("✅ Email envoyé avec succès !")
    except Exception as e:
        print("❌ Erreur lors de l'envoi :", e)


if __name__ == "__main__":
    send_test_email()
