from app.passwords import hash_password, verify_password


def test_verify_accepts_the_right_password():
    assert verify_password("secret123", hash_password("secret123"))


def test_verify_rejects_a_wrong_password():
    assert not verify_password("wrong", hash_password("secret123"))


def test_hashes_are_salted():
    assert hash_password("secret123") != hash_password("secret123")
