from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from app.config import SECRET_KEY

RESET_PASSWORD_SALT = "reset-password"
RESET_PASSWORD_MAX_AGE = 3600


def _serializer():
    return URLSafeTimedSerializer(SECRET_KEY)


def create_reset_token(email: str):
    return _serializer().dumps(email, salt=RESET_PASSWORD_SALT)


def verify_reset_token(token: str):
    try:
        return _serializer().loads(
            token,
            salt=RESET_PASSWORD_SALT,
            max_age=RESET_PASSWORD_MAX_AGE,
        )
    except (BadSignature, SignatureExpired):
        return None
