"""Tests for the authentication system."""


def test_register_user(client):
    """Test user registration creates a new user and returns user data."""
    response = client.post(
        "/auth/register",
        json={"email": "new@example.com", "password": "securepass123"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "new@example.com"
    assert "id" in data
    assert "hashed_password" not in data  # Password should never be returned


def test_register_duplicate_email(client):
    """Test that registering with an existing email returns 409."""
    client.post(
        "/auth/register",
        json={"email": "dupe@example.com", "password": "password123"},
    )
    response = client.post(
        "/auth/register",
        json={"email": "dupe@example.com", "password": "otherpass123"},
    )
    assert response.status_code == 409


def test_login_success(client):
    """Test successful login returns a JWT token."""
    # Register first
    client.post(
        "/auth/register",
        json={"email": "login@example.com", "password": "password123"},
    )
    # Login
    response = client.post(
        "/auth/login",
        json={"email": "login@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client):
    """Test login with wrong password returns 401."""
    client.post(
        "/auth/register",
        json={"email": "wrong@example.com", "password": "password123"},
    )
    response = client.post(
        "/auth/login",
        json={"email": "wrong@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_get_me_authenticated(client, auth_headers):
    """Test that /auth/me returns the authenticated user."""
    response = client.get("/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"


def test_get_me_unauthenticated(client):
    """Test that /auth/me without a token returns 401."""
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_register_short_password(client):
    """Test that a password shorter than 8 chars is rejected."""
    response = client.post(
        "/auth/register",
        json={"email": "short@example.com", "password": "short"},
    )
    assert response.status_code == 422  # Validation error
