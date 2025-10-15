import random
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)

otp_store = {}

def generate_otp(phone):
    otp = str(random.randint(100000, 999999))
    otp_store[phone] = {"otp": otp, "timestamp": datetime.now()}
    logging.info(f"OTP generated for {phone}")
    return otp

def verify_otp(phone, otp):
    record = otp_store.get(phone)
    if not record:
        return False, "No OTP sent"
    if datetime.now() - record["timestamp"] > timedelta(minutes=5):
        return False, "OTP expired"
    if record["otp"] != otp:
        return False, "Invalid OTP"
    return True, "Verified"

def cleanup_expired_otps():
    now = datetime.now()
    expired = [phone for phone, record in otp_store.items() if now - record["timestamp"] > timedelta(minutes=5)]
    for phone in expired:
        del otp_store[phone]