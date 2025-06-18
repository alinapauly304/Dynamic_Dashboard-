from passlib.context import CryptContext


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str):
    return pwd_context.verify(password, hashed)


"""from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
import base64

# Generate a 16-byte encryption key
key = get_random_bytes(16)

def encrypt_password(password: str) -> str:
    cipher = AES.new(key, AES.MODE_EAX)
    ciphertext, tag = cipher.encrypt_and_digest(password.encode())

    return ':'.join([
        base64.b64encode(cipher.nonce).decode(),
        base64.b64encode(tag).decode(),
        base64.b64encode(ciphertext).decode()
    ])

def decrypt_password(encrypted: str) -> str:
    nonce_b64, tag_b64, ciphertext_b64 = encrypted.split(':')
    nonce = base64.b64decode(nonce_b64)
    tag = base64.b64decode(tag_b64)
    ciphertext = base64.b64decode(ciphertext_b64)

    cipher = AES.new(key, AES.MODE_EAX, nonce)
    password = cipher.decrypt_and_verify(ciphertext, tag)
    return password.decode()

# DEMO
original = "mypassword123"
encrypted = encrypt_password(original)
print("Encrypted:", encrypted)

decrypted = decrypt_password(encrypted)
print("Decrypted:", decrypted)"""
