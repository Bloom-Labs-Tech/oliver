type AuthSession = {
  id: string;
  expiresAt: string;
  user: {
    id: string;
    email: string;
    username: string;
    image: string;
  }
}