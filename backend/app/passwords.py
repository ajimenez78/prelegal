"""Password hashing with the standard library's scrypt."""

import hashlib
import hmac
import os


def _scrypt(password: str, salt: bytes) -> bytes:
    return hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    return f"{salt.hex()}:{_scrypt(password, salt).hex()}"


def verify_password(password: str, stored: str) -> bool:
    salt, digest = stored.split(":")
    return hmac.compare_digest(_scrypt(password, bytes.fromhex(salt)).hex(), digest)
